"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { PushNotificationsProvider } from "@/components/providers/push-notification";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <PushNotificationsProvider>{children}</PushNotificationsProvider>
    </ConvexAuthProvider>
  );
}
