"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function TypingIndicator({
  currentUserId,
}: {
  currentUserId: Id<"users">;
}) {
  const presence = useQuery(api.presence.list) ?? [];

  const typing = presence.filter(
    (p) => p.isTyping && p.userId !== currentUserId
  );

  if (typing.length === 0) {
    return <div className="h-6 px-4" />;
  }

  const names = typing.map((p) => p.displayName);
  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.join(" and ")} are typing`;

  return (
    <div className="flex h-6 items-center gap-1.5 px-4 text-xs">
      <BouncingDots />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

function BouncingDots() {
  return (
    <span className="inline-flex items-center gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bg-muted-foreground h-1 w-1 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
