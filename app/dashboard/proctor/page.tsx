"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ShieldCheck, Monitor, Clock, Flag, Search, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, Eye, Loader2, ClipboardCheck, MessageCircle, Send, Camera,
} from "lucide-react"
import { ExamChat } from "@/components/ui/exam-chat"
import Pusher from "pusher-js"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

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
  user: { id: string; firstName: string; lastName: string; email: string }
  assessment: { id: string; title: string; type: string; course: { title: string } }
}

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

function elapsed(startedAt: string) {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
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
  const [proctorTab, setProctorTab] = useState<"monitor" | "audit">("monitor")
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [flagFilter, setFlagFilter] = useState("ALL")
  const [selected, setSelected] = useState<ExamSession | null>(null)
  const [liveSnapshot, setLiveSnapshot] = useState<string | null>(null)
  const [flagDialog, setFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState("")
  const [flagging, setFlagging] = useState(false)
  const [tick, setTick] = useState(0)

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
      const res = await fetch("/api/proctor/sessions")
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        return data
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

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

    const channel = pusher.subscribe("private-proctor-notifications")

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
      fetchSessions(true)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe("private-proctor-notifications")
      pusher.disconnect()
    }
  }, [canAccess, toast, fetchSessions, selected])

  // Live elapsed-time ticker
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => fetchSessions(true), 30000)
    return () => clearInterval(t)
  }, [fetchSessions])

  const handleFlag = async () => {
    if (!selected) return
    setFlagging(true)
    const res = await fetch("/api/proctor/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, flagged: true, flagReason }),
    })
    if (res.ok) {
      setSessions(prev => prev.map(s => s.id === selected.id ? { ...s, flagged: true, flagReason } : s))
      setSelected(prev => prev ? { ...prev, flagged: true, flagReason } : prev)
    }
    setFlagging(false)
    setFlagDialog(false)
    setFlagReason("")
  }

  const handleUnflag = async (id: string) => {
    const res = await fetch("/api/proctor/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, flagged: false, flagReason: null }),
    })
    if (res.ok) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, flagged: false, flagReason: null } : s))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, flagged: false, flagReason: null } : prev)
    }
  }

  const filtered = sessions.filter(s => {
    const name = `${s.user.firstName} ${s.user.lastName} ${s.user.email} ${s.assessment.title}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter
    const matchFlag = flagFilter === "ALL" || (flagFilter === "FLAGGED" ? s.flagged : !s.flagged)
    return matchSearch && matchStatus && matchFlag
  })

  const active    = sessions.filter(s => s.status === "IN_PROGRESS").length
  const submitted = sessions.filter(s => s.status === "SUBMITTED").length
  const flagged   = sessions.filter(s => s.flagged).length
  const total     = sessions.length

  if (!canAccess) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-violet-600" /> Exam Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor active exam sessions in real time</p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => fetchSessions(true)}
          disabled={refreshing}
          className="rounded-xl border-gray-200 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
          onClick={() => setProctorTab("audit")}
          className={`px-4 py-2 rounded-xl transition-all ${proctorTab === "audit" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          📜 Staff Audit &amp; Security Logs
        </button>
      </div>

      {proctorTab === "audit" ? (
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
            </div>
          </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
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
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-600">
                        {s.status === "IN_PROGRESS" ? (
                          <span className="text-emerald-600 font-semibold">{elapsed(s.startedAt)}</span>
                        ) : s.submittedAt ? (
                          elapsed(s.startedAt)
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
                          <Button
                            size="sm" variant="outline"
                            onClick={() => setSelected(s)}
                            className="rounded-xl text-xs h-7 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          {s.status === "IN_PROGRESS" && (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => setSelected(s)}
                              className="rounded-xl text-xs h-7 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                              title="Chat with examinee"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" /> Chat
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
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-violet-600" /> Session Detail
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
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
                      {selected.status === "IN_PROGRESS" ? elapsed(selected.startedAt) : selected.submittedAt ? elapsed(selected.startedAt) : "—"}
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

                <div className="grid grid-cols-2 gap-3 mt-3">
                  {/* Face Photo / Live Feed */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-emerald-600" />
                      {liveSnapshot ? "Live Proctoring Feed" : "Verified Face Snap"}
                    </p>
                    <div className="relative w-full h-[120px] bg-slate-900 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={liveSnapshot || selected.identityPhoto || "/placeholder-avatar.png"}
                        alt="Candidate Identity Snap"
                        className="w-full h-full object-cover"
                      />
                      {liveSnapshot ? (
                        <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow flex items-center gap-1 animate-pulse">
                          <span className="h-1 w-1 bg-white rounded-full animate-ping" /> LIVE
                        </span>
                      ) : selected.identityPhoto ? (
                        <span className="absolute bottom-2 right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="absolute bottom-2 right-2 bg-gray-400 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                          MISSING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Government ID card */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-violet-600" /> Government ID Document
                    </p>
                    <div className="relative w-full h-[120px] bg-slate-900 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.idPhoto || "/placeholder-id.png"}
                        alt="Candidate ID document"
                        className="w-full h-full object-cover animate-fade-in"
                      />
                      {selected.idPhoto ? (
                        <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                          PASSED
                        </span>
                      ) : (
                        <span className="absolute bottom-2 right-2 bg-gray-400 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                          MISSING
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Inline Chat Panel */}
              <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
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
    </div>
  )
}
