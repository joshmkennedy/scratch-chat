import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  // Extend the auth users table with app-specific fields
  users: defineTable({
    // Fields from authTables (must re-declare since we're overriding)
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    displayName: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarColor: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  inviteCodes: defineTable({
    code: v.string(),
    createdBy: v.id("users"),
    maxUses: v.optional(v.number()),
    useCount: v.number(),
    isActive: v.boolean(),
  }).index("by_code", ["code"]),

  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    linkPreview: v.optional(
      v.object({
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      })
    ),
  }),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_messageId_and_userId_and_emoji", [
      "messageId",
      "userId",
      "emoji",
    ]),

  presence: defineTable({
    userId: v.id("users"),
    isOnline: v.boolean(),
    isTyping: v.boolean(),
  }).index("by_userId", ["userId"]),
});
