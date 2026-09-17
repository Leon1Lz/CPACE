"use client"

import { useEffect, useRef, useState } from "react"

export type DraftAnswers = Record<string, { selectedOptionId?: string; content?: string }>

export function useAssessmentAutosave(id: string, sessionId: string | null, answers: DraftAnswers, enabled: boolean) {
  const version = useRef(0)
  const saved = useRef("{}")
  const inFlight = useRef(false)
  const latest = useRef(answers)
  const changedAt = useRef(0)
  const conflict = useRef(false)
  const pending = useRef<string | null>(null)
  const epoch = useRef(0)
  const [status, setStatus] = useState("Answers saved")

  const restore = (nextVersion: number, nextAnswers: DraftAnswers) => {
    epoch.current += 1
    version.current = nextVersion
    saved.current = JSON.stringify(nextAnswers)
    conflict.current = false
    pending.current = null
    setStatus("Answers saved")
  }

  useEffect(() => { latest.current = answers; changedAt.current = Date.now() }, [answers])

  useEffect(() => {
    if (!enabled || !sessionId) return
    let disposed = false
    const save = async () => {
      const snapshot = pending.current ?? JSON.stringify(latest.current)
      if (snapshot === saved.current || inFlight.current || conflict.current) return
      if (Date.now() - changedAt.current < 700) { setStatus("Unsaved changes"); return }
      inFlight.current = true
      pending.current = snapshot
      const saveEpoch = epoch.current
      setStatus("Saving answers…")
      try {
        const response = await fetch(`/api/assessments/${id}/draft`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, version: version.current, answers: JSON.parse(snapshot) }),
        })
        const data = await response.json()
        if (saveEpoch !== epoch.current) return
        if (!response.ok) {
          if (response.status === 409) conflict.current = true
          throw new Error(data.error || "Save failed; retrying automatically. Keep this page open.")
        }
        version.current = data.version
        saved.current = snapshot
        pending.current = null
        if (!disposed) setStatus(JSON.stringify(latest.current) === snapshot ? "Answers saved" : "Unsaved changes")
      } catch (error) {
        if (!disposed && saveEpoch === epoch.current) setStatus(error instanceof Error ? `${error.message} Keep this page open; saving retries automatically unless this attempt changed.` : "Offline: keep this page open. Saving will retry.")
      } finally { inFlight.current = false }
    }
    const interval = setInterval(() => { void save() }, 1000)
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(latest.current) !== saved.current) { event.preventDefault(); event.returnValue = "" }
    }
    window.addEventListener("beforeunload", warn)
    return () => { disposed = true; clearInterval(interval); window.removeEventListener("beforeunload", warn) }
  }, [enabled, id, sessionId])

  return { status, restore }
}
