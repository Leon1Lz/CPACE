"use client"

import { SessionProvider as NextAuthSessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect } from "react"

function SessionExpiryChecker({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session && (session as any).error === "SessionExpired") {
      signOut({ callbackUrl: "/login?error=session_expired" })
    }
  }, [session])

  return <>{children}</>
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionExpiryChecker>{children}</SessionExpiryChecker>
    </NextAuthSessionProvider>
  )
}
