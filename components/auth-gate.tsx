"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthScreen } from "./auth-screen";
import { CompleteSignupScreen } from "./complete-signup-screen";
import { ChatScreen } from "./chat-screen";
import { Loader2 } from "lucide-react";

export function AuthGate() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip"
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Waiting for user query to load
  if (user === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Authenticated but no profile yet
  if (!user?.displayName) {
    return <CompleteSignupScreen />;
  }

  return <ChatScreen user={user} />;
}
