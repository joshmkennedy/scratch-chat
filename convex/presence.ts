import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const setOnline = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { isOnline: true, isTyping: false });
    } else {
      await ctx.db.insert("presence", {
        userId,
        isOnline: true,
        isTyping: false,
      });
    }
  },
});

export const setOffline = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { isOnline: false, isTyping: false });
    }
  },
});

export const setTyping = mutation({
  args: { isTyping: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { isTyping: args.isTyping });
    }
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allPresence = await ctx.db.query("presence").take(10);
    const onlinePresence = allPresence.filter((p) => p.isOnline);

    const result = await Promise.all(
      onlinePresence.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        if (!user || !user.displayName) return null;

        const avatarUrl = user.avatarStorageId
          ? await ctx.storage.getUrl(user.avatarStorageId)
          : null;

        return {
          userId: p.userId,
          displayName: user.displayName,
          avatarColor: user.avatarColor ?? "#888",
          avatarUrl,
          isTyping: p.isTyping,
        };
      })
    );

    return result.filter((r) => r !== null);
  },
});
