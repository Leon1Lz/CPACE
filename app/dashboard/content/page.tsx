"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowRight, CalendarClock, ExternalLink, HelpCircle, Loader2, Newspaper, PanelsTopLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sections = [
  { title: "Training schedules", description: "Upcoming Training & Certification Events cards, registration links, dates, visibility, and ordering.", href: "/dashboard/schedules", icon: CalendarClock, color: "bg-emerald-100 text-emerald-700" },
  { title: "Industry insights", description: "Public articles, featured stories, imagery, categories, and article content.", href: "/dashboard/insights", icon: Newspaper, color: "bg-blue-100 text-blue-700" },
  { title: "Frequently asked questions", description: "Public questions, answers, categories, visibility, and display ordering.", href: "/dashboard/faqs", icon: HelpCircle, color: "bg-amber-100 text-amber-700" },
]

export default function WebsiteContentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (status !== "loading" && session?.user.role !== "ADMIN") router.replace("/dashboard")
  }, [router, session, status])
  if (status === "loading") return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
  if (session?.user.role !== "ADMIN") return null

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><PanelsTopLeft className="h-4 w-4" /> Public website</p><h1 className="mt-2 text-2xl font-black text-slate-900">Website Content</h1><p className="mt-1 text-sm text-slate-500">One place to manage content that visitors see before signing in.</p></div><Button asChild variant="outline" className="rounded-xl"><a href="/" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open website</a></Button></div>
    <div className="grid gap-5 md:grid-cols-2">{sections.map(section => { const Icon = section.icon; return <Card key={section.href} className="rounded-2xl border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><CardHeader><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${section.color}`}><Icon className="h-5 w-5" /></div><CardTitle className="mt-3 text-lg">{section.title}</CardTitle></CardHeader><CardContent><p className="min-h-12 text-sm leading-relaxed text-slate-500">{section.description}</p><Button asChild className="mt-5 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"><Link href={section.href}>Manage section<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardContent></Card> })}</div>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-bold text-slate-800">Content governance</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Only administrators can change public schedules. Every create, update, and delete operation is recorded in the audit log.</p></div>
  </div>
}
