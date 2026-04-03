import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const results = await ctx.db
      .query("messages")
      .order("desc")
      .paginate(args.paginationOpts);

    // Collect unique user IDs and message IDs
    const userIds = [...new Set(results.page.map((m) => m.userId))];
    const userMap = new Map<string, { displayName: string; avatarColor: string; avatarUrl: string | null }>();

    for (const uid of userIds) {
      const user = await ctx.db.get(uid);
      if (user) {
        const avatarUrl = user.avatarStorageId
          ? await ctx.storage.getUrl(user.avatarStorageId)
          : null;
        userMap.set(uid, {
          displayName: user.displayName ?? "Unknown",
          avatarColor: user.avatarColor ?? "#888",
          avatarUrl,
        });
      }
    }

    // Enrich messages with author info, image URLs, and reactions
    const enrichedPage = await Promise.all(
      results.page.map(async (msg) => {
        const author = userMap.get(msg.userId) ?? {
          displayName: "Unknown",
          avatarColor: "#888",
          avatarUrl: null,
        };

        const imageUrl = msg.imageStorageId
          ? await ctx.storage.getUrl(msg.imageStorageId)
          : null;

        // Get reactions for this message
        const reactionDocs = await ctx.db
          .query("reactions")
          .withIndex("by_messageId", (q) => q.eq("messageId", msg._id))
          .take(50);

        // Group reactions by emoji
        const reactionGroups: Record<string, { emoji: string; count: number; userIds: Id<"users">[] }> = {};
        for (const r of reactionDocs) {
          if (!reactionGroups[r.emoji]) {
            reactionGroups[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
          }
          reactionGroups[r.emoji].count++;
          reactionGroups[r.emoji].userIds.push(r.userId);
        }

        return {
          ...msg,
          author,
          imageUrl,
          reactions: Object.values(reactionGroups),
        };
      })
    );

    return {
      ...results,
      page: enrichedPage,
    };
  },
});

const URL_REGEX = /https?:\/\/[^\s]+/;

export const send = mutation({
  args: {
    body: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify user has completed profile
    const user = await ctx.db.get(userId);
    if (!user?.displayName) throw new Error("Profile not complete");

    const messageId = await ctx.db.insert("messages", {
      userId,
      body: args.body,
      imageStorageId: args.imageStorageId,
    });

    // Schedule link preview fetch if message contains a URL
    const urlMatch = args.body.match(URL_REGEX);
    if (urlMatch) {
      await ctx.scheduler.runAfter(0, internal.linkPreviews.fetchLinkPreview, {
        messageId,
        url: urlMatch[0],
      });
    }

    return messageId;
  },
});

export const remove = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Only author or admin can delete
    const user = await ctx.db.get(userId);
    if (message.userId !== userId && !user?.isAdmin) {
      throw new Error("Not authorized");
    }

    // Delete associated reactions
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .take(100);

    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }

    await ctx.db.delete(args.messageId);
  },
});
