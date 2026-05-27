"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { urlBase64ToUint8Array } from "@/lib/url-base-64-uint8-array"
import { SubscribePrompt } from "@/components/push-notifications/subscribe-prompt"

interface PushNotificationsContextValue {
  isSupported: boolean
  isSubscribed: boolean
  subscribeToPush: () => Promise<void>
  unsubscribeFromPush: () => Promise<void>
}

const PushNotificationsContext = createContext<PushNotificationsContextValue>({
  isSupported: false,
  isSubscribed: false,
  subscribeToPush: async () => {},
  unsubscribeFromPush: async () => {},
})

const DEVICE_ID_KEY = "scratch_chat_device_id"
const DONT_ASK_KEY = "scratch_chat_push_dont_ask"

function isPushSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window
  )
}

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export function PushNotificationsProvider({
  children,
}: {
  children: ReactNode
}) {
  const { isAuthenticated } = useConvexAuth()
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [swReady, setSwReady] = useState(false)
  const [isSupported] = useState(isPushSupported)
  const [showPrompt, setShowPrompt] = useState(false)
  const [deviceId] = useState(() =>
    typeof window === "undefined" ? null : getOrCreateDeviceId()
  )
  const lastSyncedSubscription = useRef<string | null>(null)

  const subscribeMutation = useMutation(api.notifications.subscribe)
  const unsubscribeMutation = useMutation(api.notifications.unsubscribe)
  const serverSubscribed = useQuery(
    api.notifications.isSubscribed,
    deviceId && isAuthenticated ? { deviceId } : "skip"
  )

  const isSubscribed = !!subscription

  const syncSubscriptionToServer = useCallback(
    async (sub: PushSubscription, options?: { force?: boolean }) => {
      if (!deviceId || !isAuthenticated) return

      const serialized = JSON.stringify(sub.toJSON())
      if (!options?.force && lastSyncedSubscription.current === serialized) {
        return
      }

      await subscribeMutation({
        deviceId,
        subscription: serialized,
      })
      lastSyncedSubscription.current = serialized
    },
    [deviceId, isAuthenticated, subscribeMutation]
  )

  useEffect(() => {
    if (!isAuthenticated) {
      lastSyncedSubscription.current = null
    }
  }, [isAuthenticated])

  // Register service worker and check existing subscription
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return
    }

    let cancelled = false

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(async (registration) => {
        await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()
        if (!cancelled) {
          setSubscription(sub)
          setSwReady(true)
        }
      })
      .catch((error) => {
        console.error("Failed to register push service worker:", error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // If browser has a subscription but server doesn't, re-sync it
  useEffect(() => {
    if (
      subscription &&
      deviceId &&
      isAuthenticated &&
      serverSubscribed !== true
    ) {
      syncSubscriptionToServer(subscription, {
        force: serverSubscribed === false,
      }).catch((error) => {
        console.error("Failed to sync push subscription:", error)
        lastSyncedSubscription.current = null
      })
    }
  }, [
    subscription,
    deviceId,
    isAuthenticated,
    serverSubscribed,
    syncSubscriptionToServer,
  ])

  // If server says subscribed but browser doesn't have one, clear server record
  useEffect(() => {
    if (
      !subscription &&
      swReady &&
      deviceId &&
      isAuthenticated &&
      serverSubscribed === true
    ) {
      unsubscribeMutation({ deviceId })
      lastSyncedSubscription.current = null
    }
  }, [
    subscription,
    swReady,
    deviceId,
    isAuthenticated,
    serverSubscribed,
    unsubscribeMutation,
  ])

  // Show subscribe prompt after a short delay if not subscribed
  useEffect(() => {
    if (!subscription && swReady && isAuthenticated && isSupported) {
      const dontAsk = localStorage.getItem(DONT_ASK_KEY)
      if (!dontAsk) {
        const timer = setTimeout(() => setShowPrompt(true), 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [subscription, swReady, isAuthenticated, isSupported])

  async function subscribeToPush() {
    if (!deviceId) return
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      setSubscription(sub)
      await syncSubscriptionToServer(sub)
      localStorage.removeItem(DONT_ASK_KEY)
    } catch (error) {
      console.error("Failed to subscribe to push:", error)
    }
  }

  async function unsubscribeFromPush() {
    if (!deviceId) return
    try {
      await subscription?.unsubscribe()
      setSubscription(null)
      await unsubscribeMutation({ deviceId })
      lastSyncedSubscription.current = null
    } catch (error) {
      console.error("Failed to unsubscribe from push:", error)
    }
  }

  function dontAsk() {
    localStorage.setItem(DONT_ASK_KEY, "true")
    setShowPrompt(false)
  }

  return (
    <PushNotificationsContext.Provider
      value={{
        isSupported,
        isSubscribed,
        subscribeToPush,
        unsubscribeFromPush,
      }}
    >
      {children}
      {showPrompt && isSupported && !subscription && isAuthenticated && (
        <SubscribePrompt
          onSubscribe={() => {
            subscribeToPush()
            setShowPrompt(false)
          }}
          onCancel={() => setShowPrompt(false)}
          onDontAsk={dontAsk}
        />
      )}
    </PushNotificationsContext.Provider>
  )
}

export function usePushNotifications() {
  return useContext(PushNotificationsContext)
}
