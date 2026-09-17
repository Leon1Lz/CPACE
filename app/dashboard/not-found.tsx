"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Dashboard-scoped 404 — shown when a dashboard sub-route doesn't exist
 * (e.g., /dashboard/courses/invalid-id). Renders inside the sidebar layout.
 */
export default function DashboardNotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg mb-6">
        <Search className="h-8 w-8 text-white" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>

      <Button
        onClick={() => router.push("/dashboard")}
        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
    </div>
  )
}
