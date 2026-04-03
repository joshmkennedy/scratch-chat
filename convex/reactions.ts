import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const toggle = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has this reaction
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_messageId_and_userId_and_emoji", (q) =>
        q
          .eq("messageId", args.messageId)
          .eq("userId", userId)
          .eq("emoji", args.emoji)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { added: false };
    } else {
      await ctx.db.insert("reactions", {
        messageId: args.messageId,
        userId,
        emoji: args.emoji,
      });
      return { added: true };
    }
  },
});
