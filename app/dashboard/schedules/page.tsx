"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { CalendarClock, ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { eventColors, eventDateParts, type TrainingEvent } from "@/data/training-events"

type EventForm = Omit<TrainingEvent, "id">

const emptyForm: EventForm = {
  title: "",
  certification: "",
  startDate: "",
  endDate: null,
  time: "",
  location: "",
  deliveryMode: "online",
  color: eventColors[0].value,
  spots: "Open for registration",
  registrationUrl: "https://linktr.ee/cpaceph",
  isPublished: true,
  sortOrder: 0,
}

export default function ManageSchedulesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<TrainingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/training-events?includeDrafts=true")
      if (!response.ok) throw new Error("Unable to load the public schedule.")
      setEvents(await response.json())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the public schedule.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (session?.user.role !== "ADMIN") {
      router.replace("/dashboard")
      return
    }
    const timer = window.setTimeout(() => void loadEvents(), 0)
    return () => window.clearTimeout(timer)
  }, [loadEvents, router, session, status])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, sortOrder: events.length })
    setError("")
    setDialogOpen(true)
  }

  const openEdit = (event: TrainingEvent) => {
    const { id, ...values } = event
    setEditingId(id)
    setForm(values)
    setError("")
    setDialogOpen(true)
  }

  const saveEvent = async () => {
    if (!form.title || !form.certification || !form.startDate || !form.time || !form.location) {
      setError("Complete all required fields before saving.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const response = await fetch(editingId ? `/api/training-events/${editingId}` : "/api/training-events", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Unable to save this event.")
      setEvents(current => editingId
        ? current.map(event => event.id === editingId ? result : event).sort((a, b) => a.sortOrder - b.sortOrder)
        : [...current, result].sort((a, b) => a.sortOrder - b.sortOrder))
      setDialogOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this event.")
    } finally {
      setSaving(false)
    }
  }

  const deleteEvent = async (event: TrainingEvent) => {
    if (!window.confirm(`Delete “${event.title}” from the public schedule?`)) return
    const response = await fetch(`/api/training-events/${event.id}`, { method: "DELETE" })
    if (response.ok) setEvents(current => current.filter(item => item.id !== event.id))
    else setError("Unable to delete this event.")
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700"><CalendarClock className="h-4 w-4" /> Homepage content</div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Schedules</h1>
          <p className="mt-1 text-sm text-slate-500">Add or update the training and certification events shown on the public homepage.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl"><a href="/#upcoming-events" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View homepage</a></Button>
          <Button onClick={openCreate} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" />Add event</Button>
        </div>
      </div>

      {error && !dialogOpen && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {events.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <CalendarClock className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">No upcoming events yet</p>
            <Button onClick={openCreate} variant="link" className="mt-1 text-emerald-700">Add the first event</Button>
          </div>
        ) : (
          <Table>
            <TableHeader><TableRow className="bg-slate-50/70"><TableHead className="px-5">Event</TableHead><TableHead>Date</TableHead><TableHead>Format</TableHead><TableHead>Visibility</TableHead><TableHead>Order</TableHead><TableHead className="px-5 text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="max-w-96 whitespace-normal px-5"><p className="font-semibold text-slate-900">{event.title}</p><p className="mt-0.5 text-xs text-slate-500">{event.certification} · {event.location}</p></TableCell>
                  <TableCell className="text-slate-600">{eventDateParts(event).dateLabel}<p className="text-xs text-slate-400">{event.time}</p></TableCell>
                  <TableCell className="capitalize text-slate-600">{event.deliveryMode.replace("-", " ")}</TableCell>
                  <TableCell><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{event.isPublished ? "Published" : "Draft"}</span></TableCell>
                  <TableCell className="text-slate-600">{event.sortOrder + 1}</TableCell>
                  <TableCell className="px-5 text-right"><div className="flex justify-end gap-2"><Button size="icon" variant="outline" onClick={() => openEdit(event)} aria-label={`Edit ${event.title}`} className="h-9 w-9 rounded-xl"><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={() => void deleteEvent(event)} aria-label={`Delete ${event.title}`} className="h-9 w-9 rounded-xl text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit schedule event" : "Add schedule event"}</DialogTitle>
            <DialogDescription>These details appear in the Upcoming Training &amp; Certification Events section of the public homepage.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="event-title">Event title *</Label><Input id="event-title" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Certification Review & Examination" /></div>
            <div className="space-y-1.5"><Label htmlFor="event-certification">Certification label *</Label><Input id="event-certification" value={form.certification} onChange={event => setForm(current => ({ ...current, certification: event.target.value }))} placeholder="CFMS®" /></div>
            <div className="space-y-1.5"><Label>Format *</Label><Select value={form.deliveryMode} onValueChange={value => setForm(current => ({ ...current, deliveryMode: value as TrainingEvent["deliveryMode"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="in-person">In-Person</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="event-start">Start date *</Label><Input id="event-start" type="date" value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} /></div>
            <div className="space-y-1.5"><Label htmlFor="event-end">End date</Label><Input id="event-end" type="date" value={form.endDate ?? ""} onChange={event => setForm(current => ({ ...current, endDate: event.target.value || null }))} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="event-time">Time *</Label><Input id="event-time" value={form.time} onChange={event => setForm(current => ({ ...current, time: event.target.value }))} placeholder="9:00 AM – 5:00 PM (PHT)" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="event-location">Location *</Label><Input id="event-location" value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} placeholder="Online via LMS + Proctored Exam" /></div>
            <div className="space-y-1.5"><Label htmlFor="event-spots">Availability message *</Label><Input id="event-spots" value={form.spots} onChange={event => setForm(current => ({ ...current, spots: event.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Card color</Label><Select value={form.color} onValueChange={color => setForm(current => ({ ...current, color }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eventColors.map(color => <SelectItem key={color.value} value={color.value}>{color.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="event-url">Registration URL *</Label><Input id="event-url" type="url" value={form.registrationUrl} onChange={event => setForm(current => ({ ...current, registrationUrl: event.target.value }))} /></div>
            <div className="space-y-1.5"><Label htmlFor="event-order">Display order</Label><Input id="event-order" type="number" min="1" value={form.sortOrder + 1} onChange={event => setForm(current => ({ ...current, sortOrder: Math.max(0, Number(event.target.value) - 1) }))} /></div>
            <div className="flex items-end"><div className="flex h-10 items-center gap-2"><Checkbox id="event-published" checked={form.isPublished} onCheckedChange={checked => setForm(current => ({ ...current, isPublished: Boolean(checked) }))} /><Label htmlFor="event-published">Show on homepage</Label></div></div>
          </div>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <Button onClick={() => void saveEvent()} disabled={saving} className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? "Save changes" : "Add event"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
