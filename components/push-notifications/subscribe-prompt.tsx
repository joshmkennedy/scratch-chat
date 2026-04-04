"use client";

import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscribePromptProps {
  onSubscribe: () => void;
  onCancel: () => void;
  onDontAsk: () => void;
}

export function SubscribePrompt({
  onSubscribe,
  onCancel,
  onDontAsk,
}: SubscribePromptProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="bg-card pointer-events-auto flex w-full max-w-sm flex-col gap-3 rounded-lg border p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Enable notifications?</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Get notified when new messages arrive.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSubscribe} className="flex-1">
            Enable
          </Button>
          <Button size="sm" variant="outline" onClick={onDontAsk}>
            Don&apos;t ask again
          </Button>
        </div>
      </div>
    </div>
  );
}
