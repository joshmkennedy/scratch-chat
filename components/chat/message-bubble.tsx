"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { UserAvatar } from "./user-avatar";
import { EmojiPicker } from "./emoji-picker";
import { LinkPreviewCard } from "./link-preview-card";
import { ImageLightbox } from "./image-lightbox";
import { cn } from "@/lib/utils";
import { SmilePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageData {
  _id: Id<"messages">;
  _creationTime: number;
  userId: Id<"users">;
  body: string;
  imageStorageId?: Id<"_storage">;
  imageUrl: string | null;
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
  } | null;
  author: {
    displayName: string;
    avatarColor: string;
    avatarUrl: string | null;
  };
  reactions: {
    emoji: string;
    count: number;
    userIds: Id<"users">[];
  }[];
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
}: {
  message: MessageData;
  isOwn: boolean;
  currentUserId: Id<"users">;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const toggleReaction = useMutation(api.reactions.toggle);
  const removeMessage = useMutation(api.messages.remove);

  const time = new Date(message._creationTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="group relative flex gap-3 py-1.5"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      <UserAvatar
        displayName={message.author.displayName}
        avatarColor={message.author.avatarColor}
        avatarUrl={message.author.avatarUrl}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">
            {message.author.displayName}
          </span>
          <span className="text-muted-foreground text-xs">{time}</span>
        </div>

        {/* Text body */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.body}
        </p>

        {/* Inline image */}
        {message.imageUrl && (
          <>
            <button
              onClick={() => setLightboxOpen(true)}
              className="mt-1 block"
            >
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="max-h-64 max-w-xs rounded-lg border object-cover"
              />
            </button>
            <ImageLightbox
              imageUrl={message.imageUrl}
              open={lightboxOpen}
              onOpenChange={setLightboxOpen}
            />
          </>
        )}

        {/* Link preview */}
        {message.linkPreview && (
          <LinkPreviewCard preview={message.linkPreview} />
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() =>
                  toggleReaction({
                    messageId: message._id,
                    emoji: r.emoji,
                  })
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  r.userIds.includes(currentUserId)
                    ? "border-primary/50 bg-primary/10"
                    : "hover:bg-muted"
                )}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute -top-2 right-0 flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-sm">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <SmilePlus className="h-4 w-4" />
            </Button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => {
                  toggleReaction({ messageId: message._id, emoji });
                  setShowEmojiPicker(false);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
          {isOwn && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => removeMessage({ messageId: message._id })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
