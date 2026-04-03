import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Resolve avatar URL if set
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : null;

    return { ...user, avatarUrl };
  },
});

export const isFirstUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existingUsers = await ctx.db.query("users").take(2);
    return existingUsers.length === 1 && existingUsers[0]._id === userId;
  },
});

export const createProfile = mutation({
  args: {
    displayName: v.string(),
    inviteCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.displayName) throw new Error("Profile already created");

    // Check if this is the first user (auto-admin, no invite code needed)
    const existingUsers = await ctx.db
      .query("users")
      .take(2);
    // Only the current user exists (created by auth signup)
    const isFirstUser = existingUsers.length === 1 && existingUsers[0]._id === userId;

    if (!isFirstUser) {
      const code = args.inviteCode;
      if (!code) throw new Error("Invite code is required");

      // Validate and consume invite code
      const inviteCode = await ctx.db
        .query("inviteCodes")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();

      if (!inviteCode || !inviteCode.isActive) {
        throw new Error("Invalid invite code");
      }
      if (inviteCode.maxUses && inviteCode.useCount >= inviteCode.maxUses) {
        throw new Error("Invite code has been used up");
      }

      await ctx.db.patch(inviteCode._id, {
        useCount: inviteCode.useCount + 1,
      });
    }

    // Generate a random avatar color
    const colors = [
      "#ef4444", "#f97316", "#eab308", "#22c55e",
      "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    await ctx.db.patch(userId, {
      displayName: args.displayName,
      avatarColor,
      isAdmin: isFirstUser,
    });

    return userId;
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.avatarStorageId !== undefined)
      updates.avatarStorageId = args.avatarStorageId;

    await ctx.db.patch(userId, updates);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
