import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function requireAdmin(ctx: { db: any; auth: any }) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user?.isAdmin) throw new Error("Not authorized");
  return { userId, user };
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const validateInviteCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const inviteCode = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!inviteCode || !inviteCode.isActive) return { valid: false };
    if (inviteCode.maxUses && inviteCode.useCount >= inviteCode.maxUses) {
      return { valid: false };
    }
    return { valid: true };
  },
});

export const create = mutation({
  args: { maxUses: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);

    const code = generateCode();
    await ctx.db.insert("inviteCodes", {
      code,
      createdBy: userId,
      maxUses: args.maxUses,
      useCount: 0,
      isActive: true,
    });

    return code;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("inviteCodes").take(50);
  },
});

export const deactivate = mutation({
  args: { codeId: v.id("inviteCodes") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.codeId, { isActive: false });
  },
});
