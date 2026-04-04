import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
export const isSubscribed = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const record = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId_and_deviceId", (q) =>
        q.eq("userId", userId).eq("deviceId", args.deviceId),
      )
      .unique();

    return !!record;
  },
});

export const subscribe = mutation({
  args: { deviceId: v.string(), subscription: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId_and_deviceId", (q) =>
        q.eq("userId", userId).eq("deviceId", args.deviceId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        subscription: args.subscription,
      });
    } else {
      await ctx.db.insert("pushSubscriptions", {
        userId,
        deviceId: args.deviceId,
        subscription: args.subscription,
      });
    }
  },
});

export const unsubscribe = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const record = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId_and_deviceId", (q) =>
        q.eq("userId", userId).eq("deviceId", args.deviceId),
      )
      .unique();

    if (record) {
      await ctx.db.delete(record._id);
    }
  },
});

export const getSubscriptionsExceptUser = internalQuery({
  args: { excludeUserId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all push subscriptions, filtering out the sender
    const allSubs = await ctx.db.query("pushSubscriptions").take(500);
    return allSubs.filter((sub) => sub.userId !== args.excludeUserId);
  },
});

export const removeSubscription = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subscriptionId);
  },
});

export const notifyNewMessage = internalMutation({
  args: {
    senderUserId: v.id("users"),
    senderName: v.string(),
    messageBody: v.string(),
  },
  handler: async (ctx, args) => {
    const subs = await ctx.db.query("pushSubscriptions").take(500);

    // Only notify users who are offline
    const onlineUserIds = new Set<string>();
    const presenceDocs = await ctx.db.query("presence").take(500);
    for (const p of presenceDocs) {
      if (p.isOnline) onlineUserIds.add(p.userId);
    }

    const recipients = subs.filter(
      (sub) =>
        sub.userId !== args.senderUserId && !onlineUserIds.has(sub.userId),
    );

    if (recipients.length === 0) return;

    await ctx.scheduler.runAfter(
      0,
      internal.node_notifications.sendPushToAll,
      {
        subscriptions: recipients.map((r) => ({
          id: r._id,
          subscription: r.subscription,
        })),
        payload: JSON.stringify({
          title: args.senderName,
          body:
            args.messageBody.length > 100
              ? args.messageBody.slice(0, 100) + "..."
              : args.messageBody,
          url: "/",
        }),
      },
    );
  },
});
