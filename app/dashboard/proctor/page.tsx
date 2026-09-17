"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ShieldCheck, Monitor, Clock, Flag, Search, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, Eye, Loader2, ClipboardCheck, MessageCircle, Send, Camera,
  Play,
  Grid3X3, List, GraduationCap, History, Trash2,
} from "lucide-react"
import { ExamChat } from "@/components/ui/exam-chat"
import Pusher from "pusher-js"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { buildSimulatedSessions } from "@/lib/proctor-simulation"
import { SessionEvidencePanel } from "@/components/proctoring/session-evidence-panel"
import { loadProctorSessionList } from "@/lib/proctor-session-list"
import { ProctorAssignments } from "@/components/proctoring/proctor-assignments"
import { getProctorHealth } from "@/lib/proctor-health"
import { IncidentQueue } from "@/components/proctoring/incident-queue"

type ExamSession = {
  id: string
  status: "IN_PROGRESS" | "SUBMITTED" | "ABANDONED"
  startedAt: string
  submittedAt: string | null
  flagged: boolean
  flagReason: string | null
  ipAddress: string | null
  identityPhoto?: string | null
  idPhoto?: string | null
  lastHeartbeatAt?: string | null
  cameraStatus?: string | null
  detectorStatus?: string | null
  user: { id: string; firstName: string; lastName: string; email: string }
  assessment: { id: string; title: string; type: string; motionDetectionEnabled?: boolean; course: { title: string } }
}

type LiveFrame = { snapshot: string | null; snapshotAt: string | null }

const statusColors: Record<string, string> = {
  IN_PROGRESS: "bg-emerald-100 text-emerald-700",
  SUBMITTED:   "bg-blue-100 text-blue-700",
  ABANDONED:   "bg-red-100 text-red-700",
}

const statusIcons: Record<string, React.ReactNode> = {
  IN_PROGRESS: <Clock className="h-3 w-3" />,
  SUBMITTED:   <CheckCircle className="h-3 w-3" />,
  ABANDONED:   <XCircle className="h-3 w-3" />,
}

function courseGroup(session: ExamSession) {
  const searchable = `${session.assessment.title} ${session.assessment.course.title}`.toUpperCase()
  for (const code of ["CFMS", "CMMS", "COMS"]) {
    if (searchable.includes(code)) return code
  }
  return session.assessment.course.title
}

function elapsed(startedAt: string, endedAt?: string) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const diff = Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 1000))
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// ── Inline chat panel used inside the proctor's session detail dialog ────────
type ChatMsg = {
  id: string; message: string; sentAt: string
  sender: { id: string; firstName: string; lastName: string; role: string }
}

function ProctorInlineChat({ sessionId, currentUserId, onWebcamSnapshot }: { sessionId: string; currentUserId: string; onWebcamSnapshot?: (snapshot: string) => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      if (res.ok) setMessages(await res.json())
    } catch { /* ignore */ }
  }, [sessionId])

  useEffect(() => {
    fetchMessages()

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || ""
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || ""

    if (!pusherKey) {
      console.warn("Pusher key missing in environment — falling back to polling.")
      const interval = setInterval(() => {
        fetchMessages()
      }, 5000)
      return () => clearInterval(interval)
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: "/api/pusher/auth",
    })

    const channelName = `private-exam-session-${sessionId}`
    const channel = pusher.subscribe(channelName)

    channel.bind("new-message", (newMsg: ChatMsg) => {
      setMessages(prev => {
        // Prevent duplication
        if (prev.some(m => m.id === newMsg.id)) return prev

        // Trigger reading state sync on backend
        if (newMsg.sender.id !== currentUserId) {
          fetch(`/api/chat?sessionId=${sessionId}`).catch(() => {})
        }

        return [...prev, newMsg]
      })
    })

    channel.bind("webcam-snapshot", (data: { snapshot: string }) => {
      onWebcamSnapshot?.(data.snapshot)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [sessionId, currentUserId, fetchMessages, onWebcamSnapshot])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const send = async () => {
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: draft.trim() }),
      })
      if (res.ok) {
        const msg: ChatMsg = await res.json()
        setMessages(p => {
          if (p.some(m => m.id === msg.id)) return p
          return [...p, msg]
        })
        setDraft("")
      }
    } finally { setSending(false) }
  }

  return (
    <div className="flex flex-col flex-1 bg-[#1a1a2e] min-h-[200px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 max-h-60">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-6 text-center">
            <MessageCircle className="h-7 w-7 text-violet-400/40 mb-1.5" />
            <p className="text-violet-300/60 text-xs">No messages yet. Start the conversation.</p>
          </div>
        ) : messages.map(msg => {
          const isMine = msg.sender.id === currentUserId
          const isProctor = msg.sender.role === "PROCTOR" || msg.sender.role === "ADMIN"
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              {!isMine && (
                <span className="text-[10px] text-violet-300/70 font-medium mb-0.5 ml-1">
                  {msg.sender.firstName} · {isProctor ? "Proctor" : "Learner"}
                </span>
              )}
              <div className={`max-w-[200px] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                isMine ? "bg-violet-600 text-white rounded-tr-sm" : "bg-white/10 text-white/90 rounded-tl-sm"
              }`}>
                {msg.message}
              </div>
              <span className="text-[9px] text-white/30 mt-0.5 px-1">
                {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="border-t border-white/10 px-3 py-2.5 flex gap-2 bg-[#1a1a2e]">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send() }}
          placeholder="Message examinee..."
          className="flex-1 bg-white/10 text-white text-xs placeholder-white/30 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-violet-400 border border-white/5"
        />
        <button
          onClick={send}
          disabled={!draft.trim() || sending}
          className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}


export default function ProctorPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [proctorTab, setProctorTab] = useState<"monitor" | "history" | "audit">("monitor")
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [simulationMode, setSimulationMode] = useState(false)
  const [simulationCount, setSimulationCount] = useState(12)
  const [viewMode, setViewMode] = useState<"table" | "gallery">("gallery")
  const [galleryPage, setGalleryPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [liveFrames, setLiveFrames] = useState<Record<string, LiveFrame>>({})
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [flagFilter, setFlagFilter] = useState("ALL")
  const [courseFilter, setCourseFilter] = useState("ALL")
  const [selected, setSelected] = useState<ExamSession | null>(null)
  const [liveSnapshot, setLiveSnapshot] = useState<string | null>(null)
  const [flagDialog, setFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState("")
  const [flagging, setFlagging] = useState(false)
  const [tick, setTick] = useState(() => Date.now())
  const [historySearch, setHistorySearch] = useState("")
  const [historyStatus, setHistoryStatus] = useState("ALL")
  const [historyGroup, setHistoryGroup] = useState("ALL")
  const [historySelected, setHistorySelected] = useState<Set<string>>(new Set())
  const [deleteTargets, setDeleteTargets] = useState<ExamSession[]>([])
  const [deletingHistory, setDeletingHistory] = useState(false)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditCategory, setAuditCategory] = useState<string>("ALL")
  const [auditSearch, setAuditSearch] = useState("")
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotalPages, setAuditTotalPages] = useState(1)

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true)
    try {
      const params = new URLSearchParams({
        page: auditPage.toString(),
        limit: "20",
        category: auditCategory,
        search: auditSearch,
      })
      const res = await fetch(`/api/audit?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.data ?? [])
        setAuditTotalPages(data.totalPages ?? 1)
      }
    } finally {
      setAuditLoading(false)
    }
  }, [auditPage, auditCategory, auditSearch])

  useEffect(() => {
    if (proctorTab === "audit") {
      fetchAuditLogs()
    }
  }, [proctorTab, fetchAuditLogs])

  useEffect(() => {
    setLiveSnapshot(null)
  }, [selected])

  const role = session?.user?.role?.toUpperCase()
  const currentUserId = (session?.user as any)?.id ?? ""
  const currentUserRole = role ?? "PROCTOR"
  const canAccess = role === "ADMIN" || role === "PROCTOR"

  useEffect(() => {
    if (session && !canAccess) router.push("/dashboard")
  }, [session, canAccess, router])

  const { toast } = useToast()

  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await loadProctorSessionList<ExamSession>()
      setSessions(data)
      setSelected(previous => previous && !data.some(item => item.id === previous.id) ? null : previous)
      return data
    } catch (error) {
      toast({ variant: "destructive", title: "Sessions unavailable", description: error instanceof Error ? error.message : "Please refresh." })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => { if (canAccess) void fetchSessions() }, [fetchSessions, canAccess])

  // Listen to new examinee messages globally on the proctor dashboard
  useEffect(() => {
    if (!canAccess) return

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || ""
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || ""

    if (!pusherKey) return

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: "/api/pusher/auth",
    })

    const channelName = `private-proctor-user-${currentUserId}`
    const channel = pusher.subscribe(channelName)

    channel.bind("new-chat-message", (data: {
      sessionId: string
      message: string
      learnerName: string
      assessmentTitle: string
      chat: any
    }) => {
      // Avoid notifying if the chat is already open for this exact session
      if (selected?.id === data.sessionId) return

      toast({
        title: `Message from ${data.learnerName} 💬`,
        description: `"${data.message}" in ${data.assessmentTitle}`,
        action: (
          <ToastAction
            altText="View chat"
            onClick={() => {
              setSessions(prev => {
                const found = prev.find(s => s.id === data.sessionId)
                if (found) {
                  setSelected(found)
                } else {
                  fetchSessions(true).then((latestSessions) => {
                    if (latestSessions) {
                      const latestFound = latestSessions.find((s: any) => s.id === data.sessionId)
                      if (latestFound) setSelected(latestFound)
                    }
                  })
                }
                return prev
              })
            }}
          >
            View
          </ToastAction>
        )
      })
    })

    channel.bind("session-flagged", (data: {
      sessionId: string
      learnerName: string
      assessmentTitle: string
      flagReason: string
    }) => {
      toast({
        variant: "destructive",
        title: `🚨 Violation: ${data.learnerName}`,
        description: `${data.assessmentTitle} — Reason: ${data.flagReason}`,
        action: (
          <ToastAction
            altText="View details"
            onClick={() => router.push(`/dashboard/proctor/${data.sessionId}`)}
          >
            View
          </ToastAction>
        )
      })
      fetchSessions(true)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [canAccess, currentUserId, toast, fetchSessions, selected])

  // Live elapsed-time ticker
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    if (simulationMode) return
    const t = setInterval(() => fetchSessions(true), 30000)
    return () => clearInterval(t)
  }, [fetchSessions, simulationMode])

  const visibleCameraIds = useRef("")
  useEffect(() => {
    if (simulationMode || !canAccess) return
    const fetchFrames = async () => {
      try {
        const response = await fetch(viewMode === "gallery" ? `/api/proctor/live-feed?ids=${encodeURIComponent(visibleCameraIds.current)}` : "/api/proctor/live-feed?healthOnly=true", { cache: "no-store" })
        if (response.ok) {
          const result = await response.json()
          setLiveFrames(result.frames ?? {})
          setSessions(previous => previous.map(item => ({ ...item, ...(result.health?.[item.id] ?? {}) })))
        }
      } catch {
        // Keep the most recent frames if a polling request briefly fails.
      }
    }
    const initialLoad = window.setTimeout(() => void fetchFrames(), 0)
    const poller = window.setInterval(() => void fetchFrames(), 3000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(poller)
    }
  }, [viewMode, simulationMode, canAccess])

  const handleFlag = async () => {
    if (!selected) return
    setFlagging(true)
    try {
      const res = await fetch("/api/proctor/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, flagged: true, flagReason }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || "Flag was not saved")
      }
      setSessions(prev => prev.map(s => s.id === selected.id ? { ...s, flagged: true, flagReason } : s))
      setSelected(prev => prev ? { ...prev, flagged: true, flagReason } : prev)
      setFlagDialog(false)
      setFlagReason("")
    } catch (error) {
      toast({ variant: "destructive", title: "Flag not saved", description: error instanceof Error ? error.message : "Please retry." })
    } finally { setFlagging(false) }
  }

  const handleUnflag = async (id: string) => {
    try {
      const res = await fetch("/api/proctor/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, flagged: false, flagReason: null }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || "Flag removal was not saved")
      }
      setSessions(prev => prev.map(s => s.id === id ? { ...s, flagged: false, flagReason: null } : s))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, flagged: false, flagReason: null } : prev)
    } catch (error) {
      toast({ variant: "destructive", title: "Flag removal not saved", description: error instanceof Error ? error.message : "Please retry." })
    }
  }

  const openSessionChat = (examSession: ExamSession) => {
    setLiveSnapshot(null)
    setFlagDialog(false)
    setSelected(examSession)
  }

  const deleteHistory = async () => {
    if (!deleteTargets.length) return
    setDeletingHistory(true)
    try {
      const response = await fetch("/api/proctor/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deleteTargets.map((item) => item.id) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to delete history")
      const deletedIds = new Set(deleteTargets.map((item) => item.id))
      setSessions((current) => current.filter((item) => !deletedIds.has(item.id)))
      setHistorySelected((current) => new Set(Array.from(current).filter((id) => !deletedIds.has(id))))
      setDeleteTargets([])
      toast({ title: "Exam history deleted", description: `${result.deleted} monitoring record${result.deleted === 1 ? "" : "s"} removed. Assessment results were preserved.` })
    } catch (error) {
      toast({ variant: "destructive", title: "Could not delete history", description: error instanceof Error ? error.message : "Please try again." })
    } finally {
      setDeletingHistory(false)
    }
  }

  const startSimulation = () => {
    setSessions(buildSimulatedSessions(Date.now(), simulationCount) as ExamSession[])
    setSimulationMode(true)
    setStatusFilter("ALL")
    setFlagFilter("ALL")
    setCourseFilter("ALL")
    toast({
      title: "Crowded exam simulation started",
      description: `${simulationCount} temporary examinees are now available for monitoring.`,
    })
  }

  const stopSimulation = () => {
    setSimulationMode(false)
    void fetchSessions()
  }

  const courseGroups = useMemo(() => {
    const counts = new Map<string, number>()
    for (const examSession of sessions) {
      const group = courseGroup(examSession)
      counts.set(group, (counts.get(group) ?? 0) + 1)
    }
    const preferredOrder = ["CFMS", "CMMS", "COMS"]
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.name)
      const bIndex = preferredOrder.indexOf(b.name)
      if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
      return a.name.localeCompare(b.name)
    })
  }, [sessions])

  const filtered = useMemo(() => sessions.filter(s => {
    const name = `${s.user.firstName} ${s.user.lastName} ${s.user.email} ${s.assessment.title}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter
    const matchFlag = flagFilter === "ALL" || (flagFilter === "FLAGGED" ? s.flagged : !s.flagged)
    const matchCourse = courseFilter === "ALL" || courseGroup(s) === courseFilter
    return matchSearch && matchStatus && matchFlag && matchCourse
  }).sort((a, b) => Number(b.flagged) - Number(a.flagged) || new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()), [sessions, search, statusFilter, flagFilter, courseFilter])

  const galleryPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentGalleryPage = Math.min(galleryPage, galleryPages)
  const gallerySessions = filtered.slice((currentGalleryPage - 1) * pageSize, currentGalleryPage * pageSize)
  const visibleIds = gallerySessions.map(item => item.id).join(",")
  useEffect(() => { visibleCameraIds.current = visibleIds }, [visibleIds])
  const historyBaseSessions = useMemo(() => sessions.filter((examSession) => examSession.status !== "IN_PROGRESS"), [sessions])
  const historyGroups = useMemo(() => {
    const counts = new Map<string, number>()
    for (const examSession of historyBaseSessions) {
      const group = courseGroup(examSession)
      counts.set(group, (counts.get(group) ?? 0) + 1)
    }
    const preferredOrder = ["CFMS", "CMMS", "COMS"]
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.name)
      const bIndex = preferredOrder.indexOf(b.name)
      if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
      return a.name.localeCompare(b.name)
    })
  }, [historyBaseSessions])
  const historySessions = useMemo(() => historyBaseSessions.filter((examSession) => {
    if (examSession.status === "IN_PROGRESS") return false
    const searchable = `${examSession.user.firstName} ${examSession.user.lastName} ${examSession.user.email} ${examSession.assessment.title} ${examSession.assessment.course.title}`.toLowerCase()
    return searchable.includes(historySearch.toLowerCase()) &&
      (historyStatus === "ALL" || examSession.status === historyStatus) &&
      (historyGroup === "ALL" || courseGroup(examSession) === historyGroup)
  }).sort((a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime()), [historyBaseSessions, historySearch, historyStatus, historyGroup])

  const active    = sessions.filter(s => s.status === "IN_PROGRESS").length
  const submitted = sessions.filter(s => s.status === "SUBMITTED").length
  const flagged   = sessions.filter(s => s.flagged).length
  const total     = sessions.length

  if (!canAccess) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-violet-600" /> Exam Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor active exam sessions in real time</p>
        </div>
        <div className="flex items-center gap-2">
          {simulationMode ? (
            <Button variant="outline" size="sm" onClick={stopSimulation} className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50">Exit Simulation</Button>
          ) : (
            <><label className="sr-only" htmlFor="simulation-count">Simulation examinees</label><select id="simulation-count" value={simulationCount} onChange={event => setSimulationCount(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white p-2 text-xs">{[12, 50, 100, 250].map(count => <option key={count} value={count}>{count} examinees</option>)}</select><Button size="sm" onClick={startSimulation} className="rounded-xl gap-2 bg-[#105C2E] hover:bg-[#0B4523] text-white"><Play className="h-4 w-4" /> Simulate</Button></>
          )}
          <Button
            variant="outline" size="sm"
            onClick={() => simulationMode ? setSessions(buildSimulatedSessions(Date.now(), simulationCount) as ExamSession[]) : fetchSessions(true)}
            disabled={refreshing}
            className="rounded-xl border-gray-200 gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!simulationMode && <ProctorAssignments isAdmin={role === "ADMIN"} onChanged={() => void fetchSessions(true)} />}
      {!simulationMode && proctorTab === "monitor" && <IncidentQueue />}

      {simulationMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <Play className="h-4 w-4 fill-current" />
          <strong>Simulation mode:</strong> {simulationCount} synthetic sessions with mixed connection states. No database changes or real camera streams; this is a UI exercise, not a production load test.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
          <GraduationCap className="h-4 w-4 text-[#105C2E]" /> Course groups
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCourseFilter("ALL")}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${courseFilter === "ALL" ? "border-[#105C2E] bg-[#105C2E] text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300"}`}
          >
            <span className="block text-xs font-black">All Courses</span>
            <span className={`text-[10px] ${courseFilter === "ALL" ? "text-green-100" : "text-slate-400"}`}>{sessions.length} examinees</span>
          </button>
          {courseGroups.map((group) => (
            <button
              type="button"
              key={group.name}
              onClick={() => setCourseFilter(group.name)}
              className={`min-w-28 shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${courseFilter === group.name ? "border-[#105C2E] bg-emerald-50 text-[#105C2E] ring-1 ring-emerald-100" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40"}`}
            >
              <span className="block max-w-44 truncate text-xs font-black" title={group.name}>{group.name}</span>
              <span className="text-[10px] text-slate-400">{group.count} examinee{group.count === 1 ? "" : "s"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Now",   value: active,    icon: Monitor,        gradient: "from-violet-500 to-purple-600" },
          { label: "Submitted",    value: submitted,  icon: CheckCircle,    gradient: "from-blue-500 to-cyan-600" },
          { label: "Flagged",      value: flagged,    icon: Flag,           gradient: "from-rose-500 to-pink-600" },
          { label: "Total Today",  value: total,      icon: ClipboardCheck, gradient: "from-amber-500 to-orange-600" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proctor Dashboard Navigation Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-2xl gap-1 text-xs font-bold w-fit">
        <button
          type="button"
          onClick={() => setProctorTab("monitor")}
          className={`px-4 py-2 rounded-xl transition-all ${proctorTab === "monitor" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          📺 Live Exam Monitor
        </button>
        <button
          type="button"
          onClick={() => setProctorTab("history")}
          className={`px-4 py-2 rounded-xl transition-all ${proctorTab === "history" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          🕘 Exam History
        </button>
        <button
          type="button"
          onClick={() => setProctorTab("audit")}
          className={`px-4 py-2 rounded-xl transition-all ${proctorTab === "audit" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          📜 Staff Audit &amp; Security Logs
        </button>
      </div>

      {proctorTab === "history" ? (
        <Card className="border-0 shadow-md">
          <CardHeader className="space-y-4 pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-gray-900"><History className="h-5 w-5 text-violet-600" /> Exam Session History</h2>
                <p className="mt-1 text-xs text-gray-500">Completed and abandoned monitoring records. Exam results and certificates are stored separately.</p>
              </div>
              {role === "ADMIN" && historySessions.length > 0 && (
                <div className="flex items-center gap-2">
                  {historySelected.size > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setDeleteTargets(historySessions.filter((item) => historySelected.has(item.id)))} className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50">
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete selected ({historySelected.size})
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setDeleteTargets(historySessions)} className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear filtered history
                  </Button>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500"><GraduationCap className="h-3.5 w-3.5 text-[#105C2E]" /> History groups</p>
                <p className="text-[10px] text-slate-400">Select a group to view its records or use its trash button to delete the whole group history.</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => { setHistoryGroup("ALL"); setHistorySelected(new Set()) }}
                  className={`shrink-0 rounded-xl border px-4 py-2 text-left transition ${historyGroup === "ALL" ? "border-[#105C2E] bg-[#105C2E] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}
                >
                  <span className="block text-xs font-black">All Groups</span>
                  <span className={`text-[10px] ${historyGroup === "ALL" ? "text-green-100" : "text-slate-400"}`}>{historyBaseSessions.length} records</span>
                </button>
                {historyGroups.map((group) => {
                  const groupRecords = historyBaseSessions.filter((item) => courseGroup(item) === group.name)
                  return (
                    <div key={group.name} className={`flex shrink-0 overflow-hidden rounded-xl border transition ${historyGroup === group.name ? "border-[#105C2E] bg-emerald-50 ring-1 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                      <button type="button" onClick={() => { setHistoryGroup(group.name); setHistorySelected(new Set()) }} className="min-w-28 px-4 py-2 text-left">
                        <span className={`block max-w-40 truncate text-xs font-black ${historyGroup === group.name ? "text-[#105C2E]" : "text-slate-700"}`} title={group.name}>{group.name}</span>
                        <span className="text-[10px] text-slate-400">{group.count} record{group.count === 1 ? "" : "s"}</span>
                      </button>
                      {role === "ADMIN" && (
                        <button type="button" onClick={() => setDeleteTargets(groupRecords)} aria-label={`Delete all ${group.name} history`} title={`Delete all ${group.name} history`} className="border-l border-slate-200 px-3 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-48 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search learner, assessment, or course…" className="rounded-xl border-gray-200 pl-9" />
              </div>
              <Select value={historyStatus} onValueChange={setHistoryStatus}>
                <SelectTrigger className="w-full rounded-xl border-gray-200 sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All history</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="ABANDONED">Abandoned</SelectItem>
                  <SelectItem value="FLAGGED">Flagged status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {historySessions.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400"><History className="mx-auto mb-3 h-9 w-9 text-gray-300" />No exam history matches these filters.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <Table>
                  <TableHeader className="bg-gray-50/70">
                    <TableRow>
                      {role === "ADMIN" && <TableHead className="w-10"><input type="checkbox" aria-label="Select all visible history" checked={historySessions.every((item) => historySelected.has(item.id))} onChange={(event) => setHistorySelected(event.target.checked ? new Set(historySessions.map((item) => item.id)) : new Set())} className="h-4 w-4 accent-violet-600" /></TableHead>}
                      <TableHead>Learner</TableHead><TableHead>Assessment</TableHead><TableHead>Course</TableHead><TableHead>Status</TableHead><TableHead>Started</TableHead><TableHead>Ended</TableHead><TableHead>Alerts</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historySessions.map((item) => (
                      <TableRow key={item.id} className={item.flagged ? "bg-rose-50/30" : ""}>
                        {role === "ADMIN" && <TableCell><input type="checkbox" aria-label={`Select ${item.user.firstName} ${item.user.lastName}`} checked={historySelected.has(item.id)} onChange={(event) => setHistorySelected((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next })} className="h-4 w-4 accent-violet-600" /></TableCell>}
                        <TableCell><p className="whitespace-nowrap text-sm font-semibold text-gray-900">{item.user.firstName} {item.user.lastName}</p><p className="text-[11px] text-gray-400">{item.user.email}</p></TableCell>
                        <TableCell><p className="max-w-44 truncate text-sm font-medium text-gray-800">{item.assessment.title}</p></TableCell>
                        <TableCell><p className="max-w-36 truncate text-xs text-gray-500">{item.assessment.course.title}</p></TableCell>
                        <TableCell><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${statusColors[item.status] || "bg-gray-100 text-gray-600"}`}>{item.status.replace("_", " ")}</span></TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-gray-500">{new Date(item.startedAt).toLocaleString()}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-gray-500">{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "Not submitted"}</TableCell>
                        <TableCell>{item.flagged ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><Flag className="h-3 w-3" /> Flagged</span> : <span className="text-xs text-gray-300">None</span>}</TableCell>
                        <TableCell><div className="flex justify-end gap-1.5"><Button asChild size="sm" variant="outline" className="h-7 rounded-lg text-xs"><Link href={`/dashboard/proctor/${item.id}`}><Eye className="mr-1 h-3 w-3" /> View</Link></Button>{role === "ADMIN" && <Button size="sm" variant="outline" onClick={() => setDeleteTargets([item])} className="h-7 rounded-lg border-rose-200 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>}</div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : proctorTab === "audit" ? (
        <Card className="border-0 shadow-md space-y-4 p-5">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff action, user, or details..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="pl-9 rounded-xl border-gray-200"
              />
            </div>
            <div className="flex items-center gap-2">
              {[
                { key: "ALL", label: "All Logs" },
                { key: "STAFF", label: "Staff Actions" },
                { key: "EXAM_SECURITY", label: "Exam Security Flags" },
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => { setAuditCategory(cat.key); setAuditPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${auditCategory === cat.key ? "bg-violet-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No activity logs found.</div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase">Timestamp</TableHead>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase">Category</TableHead>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase">Action</TableHead>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase">Actor / Staff</TableHead>
                    <TableHead className="text-xs font-bold text-gray-500 uppercase">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="text-xs font-mono text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${log.category === "EXAM_SECURITY" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                          {log.category === "EXAM_SECURITY" ? "🚩 Security Alert" : "👥 Staff Action"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-gray-800">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-semibold text-gray-900">{log.actorName ?? "System"}</p>
                        {log.actorEmail && <p className="text-[11px] text-gray-400">{log.actorEmail}</p>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 leading-relaxed max-w-md">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      ) : (
        /* Filters for Live Exam Monitor */
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search learner or assessment..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 rounded-xl border-gray-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="ABANDONED">Abandoned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={flagFilter} onValueChange={setFlagFilter}>
                <SelectTrigger className="w-36 rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sessions</SelectItem>
                  <SelectItem value="FLAGGED">Flagged Only</SelectItem>
                  <SelectItem value="NORMAL">Not Flagged</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("gallery")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${viewMode === "gallery" ? "bg-[#105C2E] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <Grid3X3 className="h-3.5 w-3.5" /> Gallery
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${viewMode === "table" ? "bg-[#105C2E] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <List className="h-3.5 w-3.5" /> List
                </button>
              </div>
            </div>
          </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : viewMode === "gallery" && filtered.length > 0 ? (
            <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {gallerySessions.map((s) => {
                const cameraFrame = liveFrames[s.id]?.snapshot || s.identityPhoto
                const health = getProctorHealth(s, simulationMode ? s.lastHeartbeatAt : liveFrames[s.id]?.snapshotAt, tick)
                const cameraHealth = simulationMode ? "Simulated camera" : health.camera
                const latestReason = s.flagReason?.replace(/^\[[^\]]+\]\s*/, "").split(":")[0]?.replaceAll("_", " ")
                return (
                  <article key={s.id} className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${s.flagged ? "border-rose-300 ring-1 ring-rose-100" : "border-slate-200"}`}>
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#174F2F] to-[#0A2F1C]">
                      {cameraFrame ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cameraFrame} alt={`${s.user.firstName} ${s.user.lastName} camera`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Camera className="h-9 w-9 text-white/25" /></div>
                      )}
                      <div className="absolute inset-[13%_25%] rounded-2xl border border-emerald-300/45 pointer-events-none" />
                      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">
                        <span className={`h-1.5 w-1.5 rounded-full ${cameraHealth === "Live camera" ? "bg-emerald-400 animate-pulse" : cameraHealth === "Feed stale" ? "bg-amber-400" : "bg-slate-400"}`} />
                        {cameraHealth}
                      </span>
                      {s.flagged && <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2 py-1 text-[9px] font-black uppercase text-white shadow">High priority</span>}
                    </div>
                    <div className="p-4">
                      <p className="mb-2 text-[10px] text-slate-500">{health.connection} · Detector: {health.detector}</p>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{s.user.firstName} {s.user.lastName}</h3><p className="truncate text-[11px] text-slate-400">{s.assessment.title}</p></div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${s.flagged ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{s.flagged ? "FLAGGED" : "NORMAL"}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-slate-400">Latest event</p><p className={`truncate text-xs font-semibold ${s.flagged ? "text-rose-600" : "text-slate-500"}`}>{latestReason || "No recent events"}</p></div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {!simulationMode && (
                            <Button size="sm" variant="outline" onClick={() => openSessionChat(s)} className="h-8 rounded-lg border-violet-200 px-2.5 text-xs text-violet-700 hover:bg-violet-50">
                              <MessageCircle className="mr-1 h-3 w-3" /> Chat
                            </Button>
                          )}
                          <Button asChild size="sm" className="h-8 rounded-lg bg-[#105C2E] px-2.5 text-xs text-white hover:bg-[#0B4523]"><Link href={`/dashboard/proctor/${s.id}`}><Eye className="mr-1 h-3 w-3" /> View</Link></Button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
              <p className="text-xs text-slate-400">Showing {(currentGalleryPage - 1) * pageSize + 1}–{Math.min(currentGalleryPage * pageSize, filtered.length)} of {filtered.length}; flagged sessions are prioritized.</p>
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setGalleryPage(1) }}>
                  <SelectTrigger className="h-8 w-24 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="12">12 / page</SelectItem><SelectItem value="24">24 / page</SelectItem></SelectContent>
                </Select>
                <Button size="sm" variant="outline" disabled={currentGalleryPage === 1} onClick={() => setGalleryPage((page) => Math.max(1, page - 1))} className="h-8 rounded-lg text-xs">Previous</Button>
                <span className="min-w-14 text-center text-xs font-semibold text-slate-600">{currentGalleryPage} / {galleryPages}</span>
                <Button size="sm" variant="outline" disabled={currentGalleryPage === galleryPages} onClick={() => setGalleryPage(currentGalleryPage + 1)} className="h-8 rounded-lg text-xs">Next</Button>
              </div>
            </div>
            </>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100">
                  <TableHead className="text-gray-500 font-medium">Learner</TableHead>
                  <TableHead className="text-gray-500 font-medium">Assessment</TableHead>
                  <TableHead className="text-gray-500 font-medium">Course</TableHead>
                  <TableHead className="text-gray-500 font-medium">Status</TableHead>
                  <TableHead className="text-gray-500 font-medium">Elapsed</TableHead>
                  <TableHead className="text-gray-500 font-medium">Started</TableHead>
                  <TableHead className="text-gray-500 font-medium">Flag</TableHead>
                  <TableHead className="text-gray-500 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => {
                  const initials = `${s.user.firstName[0]}${s.user.lastName[0]}`.toUpperCase()
                  const health = getProctorHealth(s, simulationMode ? s.lastHeartbeatAt : liveFrames[s.id]?.snapshotAt, tick)
                  return (
                    <TableRow key={s.id} className={`border-gray-50 hover:bg-gray-50/50 ${s.flagged ? "bg-rose-50/40" : ""}`}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{s.user.firstName} {s.user.lastName}</p>
                            <p className="text-xs text-gray-400">{s.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm text-gray-900 max-w-[160px] truncate">{s.assessment.title}</p>
                        <p className="text-xs text-gray-400">{s.assessment.type.replace("_", " ")}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[140px] truncate">{s.assessment.course.title}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>
                          {statusIcons[s.status]}{s.status.replace("_", " ")}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-500">{health.connection} · {health.detector}</p>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-600">
                        {s.status === "IN_PROGRESS" ? (
                          <span className="text-emerald-600 font-semibold">{elapsed(s.startedAt)}</span>
                        ) : s.submittedAt ? (
                          elapsed(s.startedAt, s.submittedAt)
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {new Date(s.startedAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {s.flagged ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            <Flag className="h-3 w-3" /> Flagged
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button asChild size="sm" className="rounded-xl text-xs h-7 bg-[#105C2E] hover:bg-[#0B4523] text-white">
                            <Link href={`/dashboard/proctor/${s.id}`}>
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Link>
                          </Button>
                          {!simulationMode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSessionChat(s)}
                              className="h-7 rounded-xl border-violet-200 text-xs text-violet-700 hover:bg-violet-50"
                            >
                              <MessageCircle className="mr-1 h-3 w-3" /> Chat
                            </Button>
                          )}
                          {!s.flagged ? (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => { setSelected(s); setFlagDialog(true) }}
                              className="rounded-xl text-xs h-7 border-gray-200 hover:border-rose-400 hover:text-rose-600"
                            >
                              <Flag className="h-3 w-3 mr-1" /> Flag
                            </Button>
                          ) : (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => handleUnflag(s.id)}
                              className="rounded-xl text-xs h-7 border-gray-200 hover:border-emerald-500 hover:text-emerald-600"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Unflag
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Sessions Found</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                {sessions.length === 0
                  ? "No exam sessions have been recorded yet. Sessions will appear here once learners start taking assessments."
                  : "No sessions match your current filters."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Session Detail Dialog */}
      {selected && !flagDialog && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-violet-600" /> Session Detail
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Left: session info */}
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Learner</p>
                    <p className="font-semibold text-gray-900">{selected.user.firstName} {selected.user.lastName}</p>
                    <p className="text-xs text-gray-500">{selected.user.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[selected.status]}`}>
                      {statusIcons[selected.status]}{selected.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Assessment</p>
                    <p className="font-semibold text-gray-900 truncate">{selected.assessment.title}</p>
                    <p className="text-xs text-gray-500">{selected.assessment.type.replace("_", " ")}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Course</p>
                    <p className="font-semibold text-gray-900 truncate">{selected.assessment.course.title}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Started At</p>
                    <p className="font-semibold text-gray-900">{new Date(selected.startedAt).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Elapsed Time</p>
                    <p className="font-semibold text-gray-900">
                      {selected.status === "IN_PROGRESS" ? elapsed(selected.startedAt) : selected.submittedAt ? elapsed(selected.startedAt, selected.submittedAt) : "—"}
                    </p>
                  </div>
                  {selected.ipAddress && (
                    <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                      <p className="text-xs text-gray-400 mb-1">IP Address</p>
                      <p className="font-mono text-sm text-gray-900">{selected.ipAddress}</p>
                    </div>
                  )}
                </div>
                {selected.flagged && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3 w-3" /> Flagged Session
                    </p>
                    <p className="text-sm text-rose-700">{selected.flagReason || "No reason provided."}</p>
                  </div>
                )}

                <SessionEvidencePanel key={selected.id} sessionId={selected.id} isActive={selected.status === "IN_PROGRESS"} liveSnapshot={liveSnapshot} />
              </div>

              {/* Right: Inline Chat Panel */}
              <div className="flex min-h-[360px] flex-col rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-semibold">Chat with Examinee</span>
                  {selected.status === "IN_PROGRESS" && (
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-200 text-[11px]">Live</span>
                    </span>
                  )}
                </div>
                <ProctorInlineChat
                  sessionId={selected.id}
                  currentUserId={currentUserId}
                  onWebcamSnapshot={setLiveSnapshot}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button asChild variant="outline" className="rounded-xl"><Link href={`/dashboard/proctor/${selected.id}`}><Monitor className="mr-2 h-4 w-4" />Full motion monitor</Link></Button>
              {!selected.flagged ? (
                <Button
                  variant="outline"
                  onClick={() => setFlagDialog(true)}
                  className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Flag className="h-4 w-4 mr-2" /> Flag Session
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => { handleUnflag(selected.id); setSelected(null) }}
                  className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Remove Flag
                </Button>
              )}
              <Button onClick={() => setSelected(null)} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Flag Reason Dialog */}
      {flagDialog && (
        <Dialog open onOpenChange={() => { setFlagDialog(false); setFlagReason("") }}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" /> Flag Session
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Flagging <strong>{selected?.user.firstName} {selected?.user.lastName}</strong>'s session will mark it for review.
              </p>
              <Textarea
                placeholder="Reason for flagging (e.g. suspected cheating, unusual behaviour...)"
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                rows={3}
                className="rounded-xl border-gray-200 text-sm"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setFlagDialog(false); setFlagReason("") }} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleFlag}
                disabled={flagging || !flagReason.trim()}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                {flagging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
                Confirm Flag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={deleteTargets.length > 0} onOpenChange={(open) => { if (!open && !deletingHistory) setDeleteTargets([]) }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700"><Trash2 className="h-5 w-5" /> Delete exam history?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">This permanently removes {deleteTargets.length} monitoring record{deleteTargets.length === 1 ? "" : "s"}, including associated chat messages, incident evidence, and detector events.</span>
              <span className="block font-semibold text-gray-700">Assessment scores, results, and certificates will not be deleted. Active exams cannot be deleted.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingHistory} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deletingHistory} onClick={(event) => { event.preventDefault(); void deleteHistory() }} className="rounded-xl bg-rose-600 text-white hover:bg-rose-700">
              {deletingHistory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Permanently delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
