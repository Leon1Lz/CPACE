"use client"

import { useCallback, useMemo, useState } from "react"
import { CheckCircle, FlaskConical, Loader2, RotateCcw, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAssessmentCamera } from "@/lib/use-assessment-camera"
import {
  ExamMotionMonitor,
  type DetectorStatus,
  type MotionDetectionConfig,
  type MotionViolation,
} from "@/components/proctoring/exam-motion-monitor"

type Props = {
  config: MotionDetectionConfig
}

export function MotionThresholdTest({ config }: Props) {
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState<DetectorStatus>("idle")
  const [events, setEvents] = useState<MotionViolation[]>([])
  const { streamRef, cameraError, cameraStarting, startCamera, stopCamera } = useAssessmentCamera()
  const holdSeconds = ((config.holdMs ?? 2500) / 1000).toFixed(1).replace(/\.0$/, "")
  const cooldownSeconds = ((config.cooldownMs ?? 12000) / 1000).toFixed(1).replace(/\.0$/, "")

  const testVideoRef = useCallback((video: HTMLVideoElement | null) => {
    if (!video || !streamRef.current) return
    video.srcObject = streamRef.current
    void video.play().catch(() => {})
  }, [streamRef])

  const recordTestEvent = useCallback((event: MotionViolation) => {
    setEvents(previous => [event, ...previous].slice(0, 6))
  }, [])

  const enabledChecks = useMemo(() => [
    config.detectFaceAbsence !== false && "leave or cover the camera frame",
    config.detectMultipleFaces !== false && "bring a second face into frame",
    config.detectGaze !== false && "turn your head left, right, up, or down",
    config.detectPosture !== false && "move far from your calibrated position",
  ].filter((value): value is string => Boolean(value)), [config])

  const stop = () => {
    setActive(false)
    setStatus("idle")
    stopCamera()
  }

  const start = async () => {
    setEvents([])
    setStatus("idle")
    if (await startCamera()) setActive(true)
  }

  return (
    <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-blue-950">
            <FlaskConical className="h-4 w-4" /> Motion detection threshold test
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-blue-800">
            Hold each test movement for at least {holdSeconds} seconds. Repeated alerts of the same type pause for {cooldownSeconds} seconds. This uses the values above before you save them.
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
          status === "active" ? "bg-emerald-100 text-emerald-700"
            : status === "error" ? "bg-rose-100 text-rose-700"
              : status === "loading" ? "bg-amber-100 text-amber-700"
                : "bg-white text-blue-700"
        }`}>
          {status}
        </span>
      </div>

      <ul className="grid gap-1 text-xs text-blue-900 sm:grid-cols-2">
        {enabledChecks.map(check => <li key={check}>• {check}</li>)}
      </ul>

      {cameraError && (
        <p role="alert" className="rounded-lg bg-white p-2 text-xs font-medium text-rose-700">
          {cameraError}
        </p>
      )}

      <p className="rounded-lg bg-white p-2 text-xs text-blue-800">
        Test alerts remain in this panel. They do not create incidents, notify a proctor, or affect a learner attempt.
      </p>

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button
            type="button"
            size="sm"
            disabled={cameraStarting || enabledChecks.length === 0}
            onClick={() => void start()}
            className="rounded-xl bg-blue-700 text-white hover:bg-blue-800"
          >
            {cameraStarting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="mr-1.5 h-3.5 w-3.5" />}
            {cameraStarting ? "Starting camera..." : "Start threshold test"}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={stop} className="rounded-xl border-blue-300 bg-white text-blue-800">
            <Square className="mr-1.5 h-3.5 w-3.5" /> Stop test
          </Button>
        )}
        {events.length > 0 && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setEvents([])} className="rounded-xl text-blue-800">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Clear results
          </Button>
        )}
      </div>

      {active && status === "loading" && <p role="status" className="text-xs font-medium text-amber-700">Loading the same detector used during the exam…</p>}
      {active && status === "active" && events.length === 0 && <p role="status" className="text-xs font-medium text-emerald-700">Detector ready. Perform and hold one of the movements above.</p>}

      {events.length > 0 && (
        <div className="space-y-1.5 rounded-xl bg-white p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle className="h-3.5 w-3.5" /> Threshold crossed successfully
          </p>
          {events.map((event, index) => (
            <p key={`${event.type}-${index}`} className="text-xs text-slate-700">
              <strong>{event.type}</strong> after approximately {event.duration} second{event.duration === 1 ? "" : "s"}
            </p>
          ))}
        </div>
      )}

      {active && (
        <ExamMotionMonitor
          enabled
          videoRef={testVideoRef}
          onViolation={recordTestEvent}
          onStatusChange={setStatus}
          config={config}
        />
      )}
    </div>
  )
}
