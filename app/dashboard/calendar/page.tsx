"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, GraduationCap, Loader2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CalendarItem = {
  id: string
  title: string
  subtitle: string
  date: string
  endDate?: string | null
  type: "TRAINING" | "ASSESSMENT_OPEN" | "ASSESSMENT_CLOSE" | "SCORE_RELEASE"
  href: string
}

const itemStyle = {
  TRAINING: { label: "Training", className: "bg-violet-100 text-violet-800", icon: GraduationCap },
  ASSESSMENT_OPEN: { label: "Exam opens", className: "bg-emerald-100 text-emerald-800", icon: ClipboardCheck },
  ASSESSMENT_CLOSE: { label: "Exam closes", className: "bg-rose-100 text-rose-800", icon: ClipboardCheck },
  SCORE_RELEASE: { label: "Results", className: "bg-amber-100 text-amber-800", icon: Trophy },
}

export default function CalendarPage() {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [monthKey, setMonthKey] = useState("")
  const [today, setToday] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/calendar")
      .then(async response => {
        if (!response.ok) throw new Error("Unable to load your calendar.")
        return response.json()
      })
      .then(data => {
        const currentDay = String(data.today).slice(0, 10)
        setToday(currentDay)
        setMonthKey(currentDay.slice(0, 7))
        setItems(Array.isArray(data.items) ? data.items : [])
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : "Unable to load your calendar."))
      .finally(() => setLoading(false))
  }, [])

  const monthData = useMemo(() => {
    if (!monthKey) return { label: "", cells: [] as Array<{ date: string; day: number; currentMonth: boolean }> }
    const [year, month] = monthKey.split("-").map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const gridStart = new Date(year, month - 1, 1 - firstDay.getDay())
    const cells = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + index)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      return { date: dateKey, day: date.getDate(), currentMonth: date.getMonth() === month - 1 }
    })
    return { label: firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" }), cells }
  }, [monthKey])

  const itemsByDay = useMemo(() => items.reduce<Record<string, CalendarItem[]>>((result, item) => {
    const key = item.date.slice(0, 10)
    result[key] = [...(result[key] ?? []), item]
    return result
  }, {}), [items])

  const visibleItems = useMemo(() => items.filter(item => item.date.startsWith(monthKey)), [items, monthKey])

  const moveMonth = (amount: number) => {
    const [year, month] = monthKey.split("-").map(Number)
    const next = new Date(year, month - 1 + amount, 1)
    setMonthKey(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`)
  }

  if (loading) return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
  if (error) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>

  return (
    <div className="space-y-6">
      <div><h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><CalendarDays className="h-6 w-6 text-emerald-600" /> Calendar</h1><p className="mt-1 text-sm text-slate-500">Training events, assessment windows, and result-release dates in one place.</p></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 py-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
            <Button size="icon" variant="ghost" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle className="text-base font-black text-slate-900">{monthData.label}</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="py-2">{day}</div>)}</div>
            <div className="grid grid-cols-7">
              {monthData.cells.map(cell => (
                <div key={cell.date} className={`min-h-24 border-b border-r border-slate-100 p-1.5 sm:min-h-28 sm:p-2 ${cell.currentMonth ? "bg-white" : "bg-slate-50/50"}`}>
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${cell.date === today ? "bg-emerald-600 text-white" : cell.currentMonth ? "text-slate-700" : "text-slate-300"}`}>{cell.day}</span>
                  <div className="mt-1 space-y-1">{(itemsByDay[cell.date] ?? []).slice(0, 3).map(item => <Link key={item.id} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} className={`block truncate rounded-md px-1.5 py-1 text-[9px] font-semibold sm:text-[10px] ${itemStyle[item.type].className}`} title={item.title}>{item.title}</Link>)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit rounded-2xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">{monthData.label} agenda</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {visibleItems.length ? visibleItems.map(item => {
              const meta = itemStyle[item.type]
              const Icon = meta.icon
              return <Link key={item.id} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} className="flex gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/30"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.className}`}><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{new Date(item.date).toLocaleString([], { dateStyle: "medium", timeStyle: item.type === "TRAINING" ? undefined : "short" })} · {meta.label}</p><p className="truncate text-sm font-bold text-slate-800">{item.title}</p><p className="truncate text-xs text-slate-500">{item.subtitle}</p></div></Link>
            }) : <div className="py-12 text-center"><CalendarDays className="mx-auto h-9 w-9 text-slate-200" /><p className="mt-3 text-sm font-semibold text-slate-500">Nothing scheduled this month</p></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
