"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { captureLiveSnapshot } from "@/lib/exam-live-snapshot"

export type DetectorHealth = "STARTING" | "LOADING" | "ACTIVE" | "ERROR" | "DISABLED"

export function useAssessmentLiveFeed(
  assessmentId: string,
  sessionId: string | null,
  enabled: boolean,
  videoRef: RefObject<HTMLVideoElement | null>,
  streamRef: RefObject<MediaStream | null>,
  detectorStatus: DetectorHealth,
) {
  const [feedError, setFeedError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const inFlight = useRef<Promise<boolean> | null>(null)
  const halted = useRef(false)

  const sendNow = useCallback((): Promise<boolean> => {
    if (!enabled || !sessionId || halted.current) return Promise.resolve(false)
    if (inFlight.current) return inFlight.current
    const pending = Promise.resolve().then(async () => {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 10000)
      try {
        const snapshot = captureLiveSnapshot(videoRef.current, streamRef.current)
        const live = streamRef.current?.getVideoTracks().some(track => track.readyState === "live")
        const response = await fetch(`/api/assessments/${assessmentId}/session/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            ...(snapshot ? { snapshot } : {}),
            cameraStatus: snapshot ? "CONNECTED" : live ? "STARTING" : "DISCONNECTED",
            detectorStatus,
          }),
          signal: controller.signal,
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) {
          if ([400, 401, 403, 413].includes(response.status)) halted.current = true
          throw new Error(typeof data?.error === "string" ? data.error : "The live feed was not accepted.")
        }
        if (data?.success !== true) throw new Error("The live feed could not be confirmed.")
        setFeedError(null)
        return true
      } catch (error) {
        setFeedError(error instanceof Error ? error.message : "Live feed unavailable. Retry to reconnect.")
        return false
      } finally {
        window.clearTimeout(timeout)
        inFlight.current = null
      }
    })
    inFlight.current = pending
    return pending
  }, [assessmentId, sessionId, enabled, videoRef, streamRef, detectorStatus])

  useEffect(() => {
    halted.current = false
    if (!enabled || !sessionId) return
    void sendNow()
    const interval = window.setInterval(() => { void sendNow() }, 3000)
    return () => window.clearInterval(interval)
  }, [enabled, sessionId, sendNow, attempt])

  const retryFeed = useCallback(() => { setAttempt(value => value + 1) }, [])
  const refreshFeed = useCallback(async () => {
    if (inFlight.current) await inFlight.current
    return sendNow()
  }, [sendNow])
  return { feedError, refreshFeed, retryFeed }
}
