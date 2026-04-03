"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { Loader2 } from "lucide-react";

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
  }, [status === "LoadingFirstPage"]);

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

      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isOwn={msg.userId === currentUserId}
          currentUserId={currentUserId}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
