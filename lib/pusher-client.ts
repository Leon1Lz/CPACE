import PusherClient from "pusher-js"

let pusherClientInstance: PusherClient | null = null

export function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!key || !cluster) {
    return null // Return null if not configured to trigger fallback
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    })
  }

  return pusherClientInstance
}
