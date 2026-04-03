"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import { MessageList } from "./chat/message-list";
import { MessageInput } from "./chat/message-input";
import { OnlineUsers } from "./chat/online-users";
import { TypingIndicator } from "./chat/typing-indicator";
import { AdminPanel } from "./admin-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "./chat/user-avatar";
import { LogOut, Shield } from "lucide-react";

type UserWithAvatar = Doc<"users"> & { avatarUrl: string | null };

export function ChatScreen({ user }: { user: UserWithAvatar }) {
  const { signOut } = useAuthActions();
  const setOnline = useMutation(api.presence.setOnline);
  const setOffline = useMutation(api.presence.setOffline);

  useEffect(() => {
    setOnline();

    const handleBeforeUnload = () => {
      setOffline();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setOffline();
    };
  }, [setOnline, setOffline]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="bg-background flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Scratch Chat</h1>
          <OnlineUsers />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserAvatar
                displayName={user.displayName ?? ""}
                avatarColor={user.avatarColor ?? "#888"}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="font-medium">
              {user.displayName}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.isAdmin && (
              <DropdownMenuItem
                onClick={() =>
                  document.dispatchEvent(new CustomEvent("open-admin-panel"))
                }
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col">
        <MessageList currentUserId={user._id} />
        <TypingIndicator currentUserId={user._id} />
        <MessageInput />
      </div>

      {/* Admin Panel (rendered conditionally) */}
      {user.isAdmin && <AdminPanelWrapper />}
    </div>
  );
}

function AdminPanelWrapper() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener("open-admin-panel", handler);
    return () => document.removeEventListener("open-admin-panel", handler);
  }, []);

  if (!open) return null;

  return <AdminPanel open={open} onOpenChange={setOpen} />;
}
