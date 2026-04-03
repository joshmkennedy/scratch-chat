import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function extractMetaContent(html: string, property: string): string | null {
  // Match both property="og:..." and name="og:..."
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  );
  const match = html.match(regex);
  return match ? (match[1] ?? match[2] ?? null) : null;
}

export const fetchLinkPreview = internalAction({
  args: {
    messageId: v.id("messages"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ScratchChat/1.0)",
        },
        redirect: "follow",
      });

      if (!response.ok) return;

      const html = await response.text();

      const title =
        extractMetaContent(html, "og:title") ??
        extractMetaContent(html, "twitter:title");
      const description =
        extractMetaContent(html, "og:description") ??
        extractMetaContent(html, "twitter:description");
      const imageUrl =
        extractMetaContent(html, "og:image") ??
        extractMetaContent(html, "twitter:image");

      if (!title && !description && !imageUrl) return;

      await ctx.runMutation(internal.linkPreviews.storeLinkPreview, {
        messageId: args.messageId,
        preview: {
          url: args.url,
          title: title ?? undefined,
          description: description ?? undefined,
          imageUrl: imageUrl ?? undefined,
        },
      });
    } catch {
      // Silently fail — link preview is best-effort
    }
  },
});

export const storeLinkPreview = internalMutation({
  args: {
    messageId: v.id("messages"),
    preview: v.object({
      url: v.string(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;
    await ctx.db.patch(args.messageId, { linkPreview: args.preview });
  },
});
