"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

export const sendPushToAll = internalAction({
  args: {
    subscriptions: v.array(
      v.object({
        id: v.id("pushSubscriptions"),
        subscription: v.string(),
      }),
    ),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    webpush.setVapidDetails(
      process.env.NEXT_PUBLIC_VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    for (const { id, subscription } of args.subscriptions) {
      try {
        const sub = JSON.parse(subscription);
        await webpush.sendNotification(sub, args.payload);
      } catch (error: unknown) {
        // 410 Gone or 404 means the subscription is no longer valid
        if (
          error &&
          typeof error === "object" &&
          "statusCode" in error &&
          ((error as { statusCode: number }).statusCode === 410 ||
            (error as { statusCode: number }).statusCode === 404)
        ) {
          await ctx.runMutation(internal.notifications.removeSubscription, {
            subscriptionId: id,
          });
        } else {
          console.error("Failed to send push notification:", error);
        }
      }
    }
  },
});
