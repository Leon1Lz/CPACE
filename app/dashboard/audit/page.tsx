"use client"

import { useEffect, useState } from "react"
import { Search, ScrollText, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type AuditEntry = { id: string; actorName: string | null; actorEmail: string | null; action: string; category: string; details: string | null; createdAt: string }

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [category, setCategory] = useState("ALL")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20", category, search: query })
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      fetch(`/api/audit?${params}`, { signal: controller.signal })
        .then(response => response.json())
        .then(data => { setEntries(Array.isArray(data.data) ? data.data : []); setTotalPages(data.totalPages ?? 1) })
        .finally(() => setLoading(false))
    }, 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [category, page, query])

  return <div className="space-y-6">
    <div><h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><ScrollText className="h-6 w-6 text-emerald-700" /> Audit Log</h1><p className="mt-1 text-sm text-slate-500">Review administrative changes and exam-security activity.</p></div>
    <form onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()) }} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search action, person, or details" className="pl-9" /></div>
      <Select value={category} onValueChange={value => { setCategory(value); setPage(1) }}><SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All categories</SelectItem><SelectItem value="STAFF">Staff changes</SelectItem><SelectItem value="EXAM_SECURITY">Exam security</SelectItem></SelectContent></Select>
      <Button type="submit" className="bg-emerald-700 text-white hover:bg-emerald-800">Search</Button>
    </form>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div> : entries.length ? <div className="divide-y divide-slate-100">{entries.map(entry => <div key={entry.id} className="grid gap-2 p-4 sm:grid-cols-[180px_minmax(0,1fr)_190px]"><div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.category === "EXAM_SECURITY" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>{entry.category.replace("_", " ")}</span><p className="mt-2 break-all text-xs text-slate-500">{entry.actorName || entry.actorEmail || "System"}</p></div><div className="min-w-0"><p className="text-sm font-bold text-slate-800">{entry.action.replaceAll("_", " ")}</p><p className="mt-1 break-words text-xs leading-relaxed text-slate-500">{entry.details || "No additional details"}</p></div><time className="text-xs text-slate-400 sm:text-right">{new Date(entry.createdAt).toLocaleString()}</time></div>)}</div> : <div className="py-16 text-center text-sm text-slate-500">No matching audit entries.</div>}
    </div>
    <div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</Button><span className="text-xs text-slate-500">Page {page} of {totalPages}</span><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(current => current + 1)}>Next</Button></div>
  </div>
}
