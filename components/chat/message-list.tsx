"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { Loader2 } from "lucide-react";

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDayLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const month = d.toLocaleDateString(undefined, { month: "long" });
  return `${weekday}, ${month} ${ordinal(d.getDate())}`;
}

export function MessageList({
  currentUserId,
}: {
  currentUserId: Id<"users">;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    {},
    { initialNumItems: 50 }
  );

  const isFirstPage = status === "LoadingFirstPage"

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);
  const prevResultsLength = useRef(0);

  const isAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (results.length > prevResultsLength.current && wasAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevResultsLength.current = results.length;
  }, [results.length]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [isFirstPage]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    wasAtBottom.current = isAtBottom();

    // Load more when scrolled near the top
    if (el.scrollTop < 200 && status === "CanLoadMore") {
      const prevHeight = el.scrollHeight;
      loadMore(50);
      // Preserve scroll position after loading older messages
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    }
  };

  // Messages come in desc order from the query, reverse for display
  const messages = [...results].reverse();

  const groups: { key: string; label: string; messages: typeof messages }[] = [];
  for (const msg of messages) {
    const key = dayKey(msg._creationTime);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.messages.push(msg);
    } else {
      groups.push({ key, label: formatDayLabel(msg._creationTime), messages: [msg] });
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col overflow-y-auto px-4 py-2"
    >
      {status === "LoadingFirstPage" && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      )}

      {status === "CanLoadMore" && (
        <div className="flex justify-center py-2">
          <button
            onClick={() => loadMore(50)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Load older messages
          </button>
        </div>
      )}

      {status === "Exhausted" && messages.length > 0 && (
        <p className="text-muted-foreground py-4 text-center text-xs">
          Beginning of chat history
        </p>
      )}

      {messages.length === 0 && status !== "LoadingFirstPage" && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            No messages yet. Say something!
          </p>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.key} className="relative">
          <div className="sticky top-2 z-10 flex justify-center pointer-events-none my-2">
            <div className="bg-background border rounded-full px-3 py-1 text-xs font-medium shadow-sm pointer-events-auto">
              {group.label}
            </div>
          </div>
          {group.messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.userId === currentUserId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
