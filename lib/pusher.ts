import Pusher from "pusher"

// Singleton Pusher server instance
let pusherInstance: Pusher | null = null

export function getPusherServer(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
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
  await pusher.trigger(channel, event, data)
}

/**
 * Build the private channel name for an exam session's chat.
 */
export function examChatChannel(sessionId: string) {
  return `private-exam-session-${sessionId}`
}
