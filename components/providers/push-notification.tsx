"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { urlBase64ToUint8Array } from "@/lib/url-base-64-uint8-array";
import { SubscribePrompt } from "@/components/push-notifications/subscribe-prompt";

interface PushNotificationsContextValue {
  isSupported: boolean;
  isSubscribed: boolean;
  subscribeToPush: () => Promise<void>;
  unsubscribeFromPush: () => Promise<void>;
}

const PushNotificationsContext = createContext<PushNotificationsContextValue>({
  isSupported: false,
  isSubscribed: false,
  subscribeToPush: async () => {},
  unsubscribeFromPush: async () => {},
});

const DEVICE_ID_KEY = "scratch_chat_device_id";
const DONT_ASK_KEY = "scratch_chat_push_dont_ask";

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function PushNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [swReady, setSwReady] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const subscribeMutation = useMutation(api.notifications.subscribe);
  const unsubscribeMutation = useMutation(api.notifications.unsubscribe);
  const serverSubscribed = useQuery(
    api.notifications.isSubscribed,
    deviceId && isAuthenticated ? { deviceId } : "skip",
  );

  const isSubscribed = !!subscription;

  // Initialize device ID
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // Register service worker and check existing subscription
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(async (registration) => {
          const sub = await registration.pushManager.getSubscription();
          setSubscription(sub);
          setSwReady(true);
        });
    }
  }, []);

  // If browser has a subscription but server doesn't, re-sync it
  useEffect(() => {
    if (
      subscription &&
      deviceId &&
      isAuthenticated &&
      serverSubscribed === false
    ) {
      subscribeMutation({
        deviceId,
        subscription: JSON.stringify(subscription.toJSON()),
      });
    }
  }, [subscription, deviceId, isAuthenticated, serverSubscribed, subscribeMutation]);

  // If server says subscribed but browser doesn't have one, clear server record
  useEffect(() => {
    if (
      !subscription &&
      swReady &&
      deviceId &&
      isAuthenticated &&
      serverSubscribed === true
    ) {
      unsubscribeMutation({ deviceId });
    }
  }, [subscription, swReady, deviceId, isAuthenticated, serverSubscribed, unsubscribeMutation]);

  // Show subscribe prompt after a short delay if not subscribed
  useEffect(() => {
    if (!subscription && swReady && isAuthenticated && isSupported) {
      const dontAsk = localStorage.getItem(DONT_ASK_KEY);
      if (!dontAsk) {
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [subscription, swReady, isAuthenticated, isSupported]);

  async function subscribeToPush() {
    if (!deviceId) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      setSubscription(sub);
      await subscribeMutation({
        deviceId,
        subscription: JSON.stringify(sub.toJSON()),
      });
      localStorage.removeItem(DONT_ASK_KEY);
    } catch (error) {
      console.error("Failed to subscribe to push:", error);
    }
  }

  async function unsubscribeFromPush() {
    if (!deviceId) return;
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      await unsubscribeMutation({ deviceId });
    } catch (error) {
      console.error("Failed to unsubscribe from push:", error);
    }
  }

  function dontAsk() {
    localStorage.setItem(DONT_ASK_KEY, "true");
    setShowPrompt(false);
  }

  return (
    <PushNotificationsContext.Provider
      value={{ isSupported, isSubscribed, subscribeToPush, unsubscribeFromPush }}
    >
      {children}
      {showPrompt && isSupported && !subscription && isAuthenticated && (
        <SubscribePrompt
          onSubscribe={() => {
            subscribeToPush();
            setShowPrompt(false);
          }}
          onCancel={() => setShowPrompt(false)}
          onDontAsk={dontAsk}
        />
      )}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  return useContext(PushNotificationsContext);
}
