"use client"

import { useEffect, useState } from "react"
import { Camera, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type EvidenceData = {
  session: { identityPhoto: string | null; idPhoto: string | null; ipAddress?: string | null }
  liveSnapshot: string | null
  snapshotAt: string | null
}

export function EvidenceImage({ source, label }: { source: string | null; label: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {source && source !== failedSource ? (
        // Identity evidence is a bounded data URL returned by an authorized endpoint.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source} alt={label} onError={() => setFailedSource(source)} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-slate-400">
          <Camera className="h-6 w-6" aria-hidden="true" />
          <p className="text-xs">{source ? "Image unavailable" : "No image available"}</p>
        </div>
      )}
    </div>
  )
}

export function SessionEvidencePanel({ sessionId, isActive, liveSnapshot }: {
  sessionId: string
  isActive: boolean
  liveSnapshot: string | null
}) {
  const [data, setData] = useState<EvidenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [checkedAt, setCheckedAt] = useState(() => Date.now())

  useEffect(() => {
    const controller = new AbortController()
    let pending = false
    const load = async () => {
      if (pending) return
      pending = true
      try {
        const response = await fetch(`/api/proctor/sessions/${encodeURIComponent(sessionId)}/live`, {
          cache: "no-store", signal: controller.signal,
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Unable to load session evidence")
        if (controller.signal.aborted) return
        setData(result)
        setCheckedAt(Date.now())
        setError(null)
      } catch (failure) {
        if (controller.signal.aborted) return
        setData(null)
        setError(failure instanceof Error ? failure.message : "Unable to load session evidence")
      } finally {
        pending = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    const timer = isActive ? window.setInterval(() => void load(), 5000) : null
    return () => { controller.abort(); if (timer !== null) window.clearInterval(timer) }
  }, [sessionId, isActive, retry])

  if (loading) return <div role="status" className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading protected evidence…</div>
  if (error) return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>{error}</p><Button variant="outline" size="sm" onClick={() => setRetry(value => value + 1)} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" />Retry evidence</Button></div>

  const frameIsFresh = data?.snapshotAt && checkedAt - new Date(data.snapshotAt).getTime() <= 30_000
  const snapshot = isActive && frameIsFresh ? data?.liveSnapshot || liveSnapshot : null
  return (
    <section aria-label="Session evidence" className="space-y-3">
      {isActive && <div className="rounded-xl border border-slate-200 p-3"><p className="mb-2 text-xs font-semibold text-slate-600">Latest camera frame</p><EvidenceImage source={snapshot || null} label="Latest examinee camera frame" /><p className="mt-2 text-[11px] text-slate-500">{snapshot && data?.snapshotAt ? `Captured ${new Date(data.snapshotAt).toLocaleTimeString()}` : "Waiting for a fresh camera frame."}</p></div>}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-3"><p className="mb-2 text-xs font-semibold text-slate-600">Captured face photo</p><EvidenceImage source={data?.session.identityPhoto || null} label="Captured examinee face photo" /></div>
        <div className="rounded-xl border border-slate-200 p-3"><p className="mb-2 text-xs font-semibold text-slate-600">Government ID</p><EvidenceImage source={data?.session.idPhoto || null} label="Captured government ID document" /></div>
      </div>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">Captured evidence requires human review. An uploaded image is not proof of verified identity. Missing images may have expired under the retention policy.</p>
      {data?.session.ipAddress && <p className="text-xs text-slate-500">Session IP: <span className="font-mono">{data.session.ipAddress}</span></p>}
    </section>
  )
}
