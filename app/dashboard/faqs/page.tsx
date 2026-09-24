"use client"

import { useEffect, useState } from "react"
import { HelpCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { HomepageFaq } from "@/data/homepage-faqs"

type FaqForm = Omit<HomepageFaq, "id">
const emptyForm: FaqForm = { category: "certifications", question: "", answer: "", isPublished: true, sortOrder: 0 }

export default function ManageFaqsPage() {
  const [items, setItems] = useState<HomepageFaq[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FaqForm>(emptyForm)
  const [error, setError] = useState("")

  useEffect(() => { fetch("/api/homepage-faqs?includeDrafts=true").then(response => response.json()).then(data => setItems(Array.isArray(data) ? data : [])).catch(() => setError("Unable to load FAQs.")).finally(() => setLoading(false)) }, [])

  const edit = (faq?: HomepageFaq) => {
    setEditingId(faq?.id ?? null)
    setForm(faq ? { category: faq.category, question: faq.question, answer: faq.answer, isPublished: faq.isPublished, sortOrder: faq.sortOrder } : { ...emptyForm, sortOrder: items.length })
    setError("")
    setOpen(true)
  }

  const save = async () => {
    setSaving(true); setError("")
    try {
      const response = await fetch(editingId ? `/api/homepage-faqs/${editingId}` : "/api/homepage-faqs", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Unable to save FAQ.")
      setItems(current => (editingId ? current.map(item => item.id === editingId ? result : item) : [...current, result]).sort((a, b) => a.sortOrder - b.sortOrder))
      setOpen(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save FAQ.") }
    finally { setSaving(false) }
  }

  const remove = async (faq: HomepageFaq) => {
    if (!window.confirm(`Delete “${faq.question}”?`)) return
    const response = await fetch(`/api/homepage-faqs/${faq.id}`, { method: "DELETE" })
    if (response.ok) setItems(current => current.filter(item => item.id !== faq.id))
    else setError("Unable to delete FAQ.")
  }

  if (loading) return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><HelpCircle className="h-6 w-6 text-emerald-700" /> Manage FAQs</h1><p className="mt-1 text-sm text-slate-500">Questions and answers shown in the public homepage FAQ section.</p></div><Button onClick={() => edit()} className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"><Plus className="mr-2 h-4 w-4" />Add FAQ</Button></div>
    {error && !open && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    <div className="space-y-3">{items.map(faq => <div key={faq.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{faq.category}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${faq.isPublished ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{faq.isPublished ? "Published" : "Draft"}</span></div><h2 className="mt-3 text-sm font-bold text-slate-900">{faq.question}</h2><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{faq.answer}</p></div><div className="flex shrink-0 gap-2"><Button size="icon" variant="outline" onClick={() => edit(faq)} aria-label={`Edit ${faq.question}`}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={() => void remove(faq)} aria-label={`Delete ${faq.question}`} className="text-rose-600"><Trash2 className="h-4 w-4" /></Button></div></div>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl rounded-2xl"><DialogHeader><DialogTitle>{editingId ? "Edit FAQ" : "Add FAQ"}</DialogTitle><DialogDescription>Published entries appear on the public homepage immediately after saving.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={category => setForm(current => ({ ...current, category: category as HomepageFaq["category"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="certifications">Certifications &amp; exams</SelectItem><SelectItem value="partnerships">Partnerships</SelectItem><SelectItem value="verification">Verification &amp; support</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="faq-question">Question</Label><Input id="faq-question" value={form.question} onChange={event => setForm(current => ({ ...current, question: event.target.value }))} /></div><div className="space-y-1.5"><Label htmlFor="faq-answer">Answer</Label><Textarea id="faq-answer" rows={7} value={form.answer} onChange={event => setForm(current => ({ ...current, answer: event.target.value }))} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="faq-order">Display order</Label><Input id="faq-order" type="number" min="1" value={form.sortOrder + 1} onChange={event => setForm(current => ({ ...current, sortOrder: Math.max(0, Number(event.target.value) - 1) }))} /></div><div className="flex items-end"><div className="flex h-10 items-center gap-2"><Checkbox id="faq-published" checked={form.isPublished} onCheckedChange={checked => setForm(current => ({ ...current, isPublished: Boolean(checked) }))} /><Label htmlFor="faq-published">Show on homepage</Label></div></div></div>{error && <p role="alert" className="text-sm text-rose-600">{error}</p>}<Button onClick={() => void save()} disabled={saving} className="w-full bg-emerald-700 text-white hover:bg-emerald-800">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save FAQ</Button></div></DialogContent></Dialog>
  </div>
}
