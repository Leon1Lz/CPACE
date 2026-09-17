"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-6 bg-slate-900/60 border border-slate-800 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-2xl">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-950/50 animate-bounce">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Something Went Wrong
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            An unexpected error occurred. You can retry your last action or return to the main dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={reset}
            className="w-full sm:w-auto px-6 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-sm transition-all"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Error digest */}
        {error.digest && (
          <p className="text-[11px] text-slate-500 font-mono pt-2">
            Reference ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
