"use client"

import { SessionProvider as NextAuthSessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect, useRef } from "react"

const SESSION_KEY = "cpace_session_active"
const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes of inactivity

function SessionExpiryChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Check for server-side invalidated session (concurrent login or suspension)
  useEffect(() => {
    if (session && (session as any).error === "SessionExpired") {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_KEY)
      }
      signOut({ callbackUrl: "/login?error=session_expired" })
    } else if (session && (session as any).error === "UserSuspended") {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_KEY)
      }
      signOut({ callbackUrl: "/login?error=UserSuspended" })
    }
  }, [session])

  // 2. Browser Exit / Close Detection
  // Uses sessionStorage + BroadcastChannel cross-tab ping to detect when all tabs/windows were exited.
  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined") return

    let channel: BroadcastChannel | null = null
    let timeoutId: NodeJS.Timeout | null = null

    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("cpace_session_sync")
        channel.onmessage = (event) => {
          if (event.data === "ping") {
            channel?.postMessage("pong")
          }
        }
      }
    } catch {
      // BroadcastChannel unavailable
    }

    const hasTabSession = sessionStorage.getItem(SESSION_KEY)

    if (!hasTabSession) {
      if (channel) {
        let siblingResponded = false
        const handlePong = (event: MessageEvent) => {
          if (event.data === "pong") {
            siblingResponded = true
            sessionStorage.setItem(SESSION_KEY, "true")
          }
        }
        channel.addEventListener("message", handlePong)
        channel.postMessage("ping")

        timeoutId = setTimeout(() => {
          channel?.removeEventListener("message", handlePong)
          if (!siblingResponded) {
            // No other tabs alive; this is a brand new browser launch after exit
            sessionStorage.removeItem(SESSION_KEY)
            signOut({ callbackUrl: "/login?error=browser_closed" })
          } else {
            sessionStorage.setItem(SESSION_KEY, "true")
          }
        }, 300)
      } else {
        sessionStorage.setItem(SESSION_KEY, "true")
      }
    } else {
      sessionStorage.setItem(SESSION_KEY, "true")
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (channel) channel.close()
    }
  }, [status])

  // 3. Inactivity / Idle Timeout (30 minutes)
  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined") return

    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        sessionStorage.removeItem(SESSION_KEY)
        signOut({ callbackUrl: "/login?error=inactivity_timeout" })
      }, IDLE_TIMEOUT_MS)
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"]
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }))
    window.addEventListener("cpace_user_activity", resetTimer)

    resetTimer()

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      events.forEach((ev) => window.removeEventListener(ev, resetTimer))
      window.removeEventListener("cpace_user_activity", resetTimer)
    }
  }, [status])

  return <>{children}</>
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionExpiryChecker>{children}</SessionExpiryChecker>
    </NextAuthSessionProvider>
  )
}
