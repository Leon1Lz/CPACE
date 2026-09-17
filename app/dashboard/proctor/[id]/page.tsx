"use client"

/* eslint-disable @next/next/no-img-element */

import { use, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, Clock3, Eye, Flag, Loader2, MessageCircle, RefreshCw, ScanFace, ShieldCheck, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExamChat } from "@/components/ui/exam-chat"
import { ProctorVideoFeed } from "@/components/proctoring/proctor-video-feed"
import { EvidenceImage } from "@/components/proctoring/session-evidence-panel"
import { useSession } from "next-auth/react"
import { getProctorHealth } from "@/lib/proctor-health"

type MotionEvent = {
  id: string
  reason: string
  occurredAt: string
  reviewStatus?: "PENDING" | "REVIEWED" | "FALSE_POSITIVE" | "CONFIRMED" | "ESCALATED"
  reviewNotes?: string | null
  reviewedByName?: string | null
  evidenceSnapshot?: string | null
}
type MonitorData = {
  session: {
    id: string
    status: string
    startedAt: string
    submittedAt: string | null
    flagged: boolean
    flagReason: string | null
    identityPhoto: string | null
    idPhoto: string | null
    lastHeartbeatAt: string | null
    cameraStatus: string | null
    detectorStatus: string | null
    user: { firstName: string; lastName: string; email: string }
    assessment: { title: string; type: string; motionDetectionEnabled?: boolean; course: { title: string } }
  }
  liveSnapshot: string | null
  snapshotAt: string | null
  events: MotionEvent[]
}

function parseReason(reason: string) {
  const match = reason.match(/^\[([^\]]+)\]\s+([^:]+):\s*(.*?)(?:\s+\(([\d.]+)s\))?$/)
  return {
    severity: match?.[1] || "ALERT",
    type: (match?.[2] || "SECURITY EVENT").replaceAll("_", " "),
    description: match?.[3] || reason,
    duration: match?.[4] ? `${match[4]}s` : null,
  }
}

function elapsed(startedAt: string, endedAt?: string) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const seconds = Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours ? `${hours}h ${minutes}m` : `${minutes}m ${rest}s`
}

export default function MotionMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: authSession } = useSession()
  const [data, setData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [now, setTick] = useState(() => Date.now())

  const loadMonitor = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const response = await fetch(`/api/proctor/sessions/${id}/live`, { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to load this session")
      setData(result)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load this session")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadMonitor(), 0)
    const poller = window.setInterval(() => void loadMonitor(), 2000)
    const clock = window.setInterval(() => setTick(Date.now()), 1000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(poller)
      window.clearInterval(clock)
    }
  }, [loadMonitor])

  const latestEvent = data?.events[0]
  const alertCounts = useMemo(() => {
    const counts = { face: 0, gaze: 0, posture: 0, other: 0 }
    for (const event of data?.events ?? []) {
      const reason = event.reason.toUpperCase()
      if (reason.includes("FACE")) counts.face++
      else if (reason.includes("LOOKING") || reason.includes("GAZE")) counts.gaze++
      else if (reason.includes("POSTURE")) counts.posture++
      else counts.other++
    }
    return counts
  }, [data?.events])

  const reviewEvent = async (eventId: string, reviewStatus: string) => {
    if (id.startsWith("simulation-")) return
    setReviewingId(eventId)
    setReviewError(null)
    try {
      const response = await fetch(`/api/proctor/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Review was not saved")
      await loadMonitor()
    } catch (failure) {
      setReviewError(failure instanceof Error ? failure.message : "Review was not saved")
    } finally {
      setReviewingId(null)
    }
  }

  if (loading) {
    return <div className="min-h-[65vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#105C2E]" /></div>
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Motion monitor unavailable</h1>
        <p className="text-sm text-slate-500">{error}</p>
        <Button asChild variant="outline"><Link href="/dashboard/proctor">Return to Exam Monitor</Link></Button>
      </div>
    )
  }

  const candidateName = `${data.session.user.firstName} ${data.session.user.lastName}`
  const health = getProctorHealth(data.session, data.snapshotAt, now)
  const lastSignalAt = data.snapshotAt
  const connectionState = health.connection
  const latest = latestEvent ? parseReason(latestEvent.reason) : null

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] space-y-6 bg-[#F5F8F6] p-6 pb-10">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#105C2E] p-5 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="outline" size="icon" className="rounded-xl shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link href="/dashboard/proctor"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white">Examinee Monitoring</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider ${connectionState === "LIVE" ? "bg-emerald-100 text-emerald-700" : connectionState === "STALE" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                <span className={`h-2 w-2 rounded-full ${connectionState === "LIVE" ? "bg-emerald-500 animate-pulse" : connectionState === "STALE" ? "bg-amber-500" : "bg-slate-400"}`} />
                {connectionState}
              </span>
            </div>
            <p className="text-sm text-green-100 mt-1">{candidateName} · {data.session.assessment.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          {!id.startsWith("simulation-") && (
            <Button variant="outline" onClick={() => document.getElementById("chat-fab")?.click()} className="rounded-xl gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <MessageCircle className="h-4 w-4" /> Chat with examinee
            </Button>
          )}
          <Button variant="outline" onClick={() => void loadMonitor(true)} disabled={refreshing} className="rounded-xl gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh feed
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Session Time", value: data.session.status === "IN_PROGRESS" ? elapsed(data.session.startedAt) : data.session.submittedAt ? elapsed(data.session.startedAt, data.session.submittedAt) : "—", icon: Clock3, color: "text-[#105C2E] bg-green-50" },
          { label: "Face Alerts", value: alertCounts.face, icon: ScanFace, color: "text-rose-600 bg-rose-50" },
          { label: "Gaze Alerts", value: alertCounts.gaze, icon: Eye, color: "text-amber-600 bg-amber-50" },
          { label: "Posture Alerts", value: alertCounts.posture, icon: UserRound, color: "text-blue-600 bg-blue-50" },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${item.color}`}><item.icon className="h-5 w-5" /></div>
              <div><p className="text-xs text-slate-400 font-semibold">{item.label}</p><p className="text-xl font-black text-slate-900">{item.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden bg-slate-950">
            <CardHeader className="border-b border-white/10 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-white flex items-center gap-2"><Camera className="h-4 w-4 text-emerald-400" /> Candidate Camera</CardTitle>
              <span className="text-[10px] text-slate-400">{lastSignalAt ? `Last frame ${new Date(lastSignalAt).toLocaleTimeString()}` : "Waiting for live frame"}</span>
            </CardHeader>
            <ProctorVideoFeed
              sessionId={id}
              fallbackSnapshot={data.liveSnapshot || data.session.identityPhoto}
              candidateName={candidateName}
              stale={health.camera !== "Live camera"}
            />
          </Card>

          {latest ? (
            <Card className="border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 shadow-sm">
              <CardContent className="p-5 flex gap-4">
                <div className="h-11 w-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><p className="font-black text-rose-900">{latest.type}</p><span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-black text-rose-800">{latest.severity}</span>{latest.duration && <span className="text-xs text-rose-600">Held {latest.duration}</span>}</div>
                  <p className="text-sm text-rose-700 mt-1">{latest.description}</p>
                  <p className="text-[11px] text-rose-500 mt-2">Latest detection · {new Date(latestEvent!.occurredAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-emerald-200 bg-emerald-50"><CardContent className="p-5 flex items-center gap-3 text-emerald-800"><CheckCircle2 className="h-5 w-5" /><p className="text-sm font-semibold">No motion violations detected in this session.</p></CardContent></Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#105C2E]" /> Session Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-xs text-slate-400">Candidate</p><p className="font-bold text-slate-900">{candidateName}</p><p className="text-xs text-slate-500">{data.session.user.email}</p></div>
              <div className="border-t pt-3"><p className="text-xs text-slate-400">Course</p><p className="font-semibold text-slate-800">{data.session.assessment.course.title}</p></div>
              <div className="border-t pt-3"><p className="text-xs text-slate-400">Started</p><p className="font-semibold text-slate-800">{new Date(data.session.startedAt).toLocaleString()}</p></div>
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div><p className="text-xs text-slate-400">Camera</p><p className={`text-xs font-bold ${health.camera === "Live camera" ? "text-emerald-600" : "text-amber-600"}`}>{health.camera}</p></div>
                <div><p className="text-xs text-slate-400">Detector</p><p className="text-xs font-bold text-slate-700">{health.detector}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div><p className="text-xs text-slate-500 mb-2">Captured face photo</p><EvidenceImage source={data.session.identityPhoto} label="Captured examinee face photo" /></div>
                <div><p className="text-xs text-slate-500 mb-2">Government ID</p><EvidenceImage source={data.session.idPhoto} label="Captured government ID document" /></div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">Captured images require human review; they do not automatically verify identity. Missing evidence may have expired under the retention policy.</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-sm flex items-center gap-2"><Flag className="h-4 w-4 text-rose-600" /> Detection Timeline</CardTitle><span className="text-xs text-slate-400">{data.events.length} events</span></CardHeader>
            <CardContent>
              {reviewError && <p role="alert" className="mb-3 text-xs text-rose-700">{reviewError}</p>}
              <div className="max-h-[390px] overflow-y-auto space-y-3 pr-1">
                {data.events.length ? data.events.map((event) => {
                  const parsed = parseReason(event.reason)
                  return (
                    <div key={event.id} className="relative pl-5 pb-4 border-l border-rose-200 last:pb-0">
                      <span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ring-4 ${event.reviewStatus && event.reviewStatus !== "PENDING" ? "bg-emerald-500 ring-emerald-50" : "bg-rose-500 ring-rose-50"}`} />
                      <div className="flex justify-between gap-3"><p className="text-xs font-black text-slate-800">{parsed.type}</p><time className="text-[10px] text-slate-400 shrink-0">{new Date(event.occurredAt).toLocaleTimeString()}</time></div>
                      <p className="text-xs text-slate-500 mt-1">{parsed.description}</p>
                      {event.evidenceSnapshot && <div className="mt-2 h-20 overflow-hidden rounded-lg bg-slate-900"><img src={event.evidenceSnapshot} alt="Incident evidence" className="h-full w-full object-cover" /></div>}
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={event.reviewStatus || "PENDING"}
                          disabled={reviewingId === event.id || id.startsWith("simulation-")}
                          onChange={(changeEvent) => void reviewEvent(event.id, changeEvent.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none focus:border-emerald-500"
                        >
                          <option value="PENDING">Pending review</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="FALSE_POSITIVE">False positive</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="ESCALATED">Escalated</option>
                        </select>
                        {reviewingId === event.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#105C2E]" />}
                      </div>
                      {event.reviewedByName && <p className="mt-1 text-[9px] text-slate-400">Reviewed by {event.reviewedByName}</p>}
                      {event.reviewNotes && <p className="mt-1 text-xs text-slate-600">Review notes: {event.reviewNotes}</p>}
                    </div>
                  )
                }) : <p className="text-center py-10 text-xs text-slate-400">Detector events will appear here in real time.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ExamChat
        sessionId={id}
        currentUserId={(authSession?.user as { id?: string } | undefined)?.id ?? ""}
        currentUserRole={authSession?.user?.role ?? "PROCTOR"}
        show={!id.startsWith("simulation-")}
      />
    </div>
  )
}
