"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Dashboard-level error boundary.
 * Catches errors within any dashboard page without crashing the entire app.
 * Renders inside the dashboard layout (sidebar remains visible).
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg mb-6">
        <AlertTriangle className="h-8 w-8 text-white" />
      </div>

      {/* Message */}
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Page Error
      </h2>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
        Something went wrong loading this page. You can try reloading it, or
        go back to the dashboard.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={reset}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="rounded-xl border-gray-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      {/* Error digest */}
      {error.digest && (
        <p className="text-xs text-gray-300 font-mono mt-6">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
}
