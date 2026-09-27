"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowRight, CalendarClock, ExternalLink, HelpCircle, Loader2, Newspaper, PanelsTopLeft, RefreshCw, CheckCircle2, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sections = [
  { title: "Training schedules", description: "Upcoming Training & Certification Events cards, registration links, dates, visibility, and ordering.", href: "/dashboard/schedules", icon: CalendarClock, color: "bg-emerald-100 text-emerald-700", key: "schedules" },
  { title: "Industry insights", description: "Public articles, featured stories, imagery, categories, and article content.", href: "/dashboard/insights", icon: Newspaper, color: "bg-blue-100 text-blue-700", key: "articles" },
  { title: "Frequently asked questions", description: "Public questions, answers, categories, visibility, and display ordering.", href: "/dashboard/faqs", icon: HelpCircle, color: "bg-amber-100 text-amber-700", key: "faqs" },
]

export default function WebsiteContentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    articles?: { inDb: number; available: number }
    schedules?: { inDb: number; available: number }
    faqs?: { inDb: number; available: number }
  } | null>(null)

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/sync-landing-data")
      if (res.ok) {
        setStats(await res.json())
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (status !== "loading" && session?.user.role !== "ADMIN") router.replace("/dashboard")
    if (session?.user.role === "ADMIN") {
      void loadStats()
    }
  }, [router, session, status])

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      setSyncMessage(null)
      const res = await fetch("/api/admin/sync-landing-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "all" }),
      })
      if (res.ok) {
        const data = await res.json()
        setSyncMessage(`All landing page content synchronized (${data.articlesSynced ?? 0} articles, ${data.schedulesSynced ?? 0} schedules, ${data.faqsSynced ?? 0} FAQs).`)
        await loadStats()
      }
    } catch (err) {
      console.error("Sync error:", err)
    } finally {
      setSyncing(false)
    }
  }

  if (status === "loading") return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
  if (session?.user.role !== "ADMIN") return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <PanelsTopLeft className="h-4 w-4" /> Public website
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Website Content</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and synchronize the content displayed across the public landing page.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={syncing}
            className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold"
          >
            <RefreshCw className={`mr-2 h-4 w-4 text-emerald-700 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync All Landing Data"}
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />Open website
            </a>
          </Button>
        </div>
      </div>

      {syncMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Database Content Status */}
      {stats && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-bold text-slate-800">Database Synchronization Status</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">Landing Page Content</span>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Industry Insights & Articles</p>
              <p className="mt-1 text-lg font-black text-slate-900">{stats.articles?.inDb ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats.articles?.available ?? 22} in database</span></p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Training & Certification Schedules</p>
              <p className="mt-1 text-lg font-black text-slate-900">{stats.schedules?.inDb ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats.schedules?.available ?? 4} in database</span></p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Homepage Frequently Asked Questions</p>
              <p className="mt-1 text-lg font-black text-slate-900">{stats.faqs?.inDb ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats.faqs?.available ?? 6} in database</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {sections.map(section => {
          const Icon = section.icon
          const count = section.key === "articles" ? stats?.articles?.inDb : section.key === "schedules" ? stats?.schedules?.inDb : stats?.faqs?.inDb
          return (
            <Card key={section.href} className="rounded-2xl border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${section.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-lg flex items-center justify-between">
                  <span>{section.title}</span>
                  {typeof count === "number" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {count} items
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="min-h-12 text-sm leading-relaxed text-slate-500">{section.description}</p>
                <Button asChild className="mt-5 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
                  <Link href={section.href}>
                    Manage section<ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-800">Content governance &amp; synchronization</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Only administrators can modify website content. Syncing ensures default landing page cards, articles, and FAQs exist in the database so you can edit their copy, images, and publishing status without leaving the dashboard.
        </p>
      </div>
    </div>
  )
}
