"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserAvatar } from "./user-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function OnlineUsers() {
  const presence = useQuery(api.presence.list) ?? [];

  if (presence.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground mr-1 text-xs">Online:</span>
      <div className="flex -space-x-1.5">
        {presence.map((p) => (
          <Tooltip key={p.userId}>
            <TooltipTrigger asChild>
              <div className="relative">
                {p.isTyping && <TypingEllipsis />}
                <div className="ring-background rounded-full ring-2">
                  <UserAvatar
                    displayName={p.displayName}
                    avatarColor={p.avatarColor}
                    avatarUrl={p.avatarUrl}
                    size="sm"
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {p.displayName}
                {p.isTyping ? " (typing...)" : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function TypingEllipsis() {
  return (
    <span className="absolute -bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-[1px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bg-foreground h-[3px] w-[3px] rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
