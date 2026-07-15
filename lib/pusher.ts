import Pusher from "pusher"

// Singleton Pusher server instance
let pusherInstance: Pusher | null = null

export function getPusherServer(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!appId || !key || !secret || !cluster) {
    return null
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    })
  }
  return pusherInstance
}

/**
 * Trigger a Pusher event on a channel.
 * Channel names use the "private-" prefix for authenticated channels.
 */
export async function triggerEvent(
  channel: string,
  event: string,
  data: Record<string, unknown>
) {
  const pusher = getPusherServer()
  if (!pusher) return // Skip if Pusher is not configured
  try {
    await pusher.trigger(channel, event, data)
  } catch (err) {
    console.error("Failed to trigger Pusher event:", err)
  }
}

/**
 * Build the private channel name for an exam session's chat.
 */
export function examChatChannel(sessionId: string) {
  return `private-exam-session-${sessionId}`
}
