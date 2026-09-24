"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Camera, CameraOff, ScanFace, ShieldCheck } from "lucide-react"

export type DetectorStatus = "idle" | "loading" | "active" | "error"

type FaceLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => { faceLandmarks: Array<Array<{ x: number; y: number; z: number }>> }
  close: () => void
}

export type MotionViolation = {
  type: string
  description: string
  severity: "warning" | "high"
  duration: number
}

type Props = {
  enabled: boolean
  videoRef: (element: HTMLVideoElement | null) => void
  onViolation: (violation: MotionViolation) => void
  onStatusChange?: (status: DetectorStatus) => void
  config?: MotionDetectionConfig
}

export type MotionDetectionConfig = {
  holdMs?: number
  cooldownMs?: number
  detectFaceAbsence?: boolean
  detectMultipleFaces?: boolean
  detectGaze?: boolean
  detectPosture?: boolean
}

const HOLD_MS = 2500
const COOLDOWN_MS = 12000
const DETECTOR_LOAD_TIMEOUT_MS = 30000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Motion detector loading timed out")),
      timeoutMs,
    )
    promise.then(
      value => { window.clearTimeout(timeout); resolve(value) },
      error => { window.clearTimeout(timeout); reject(error) },
    )
  })
}

export function ExamMotionMonitor({ enabled, videoRef, onViolation, onStatusChange, config }: Props) {
  const holdMs = config?.holdMs ?? HOLD_MS
  const cooldownMs = config?.cooldownMs ?? COOLDOWN_MS
  const detectFaceAbsence = config?.detectFaceAbsence !== false
  const detectMultipleFaces = config?.detectMultipleFaces !== false
  const detectGaze = config?.detectGaze !== false
  const detectPosture = config?.detectPosture !== false
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<FaceLandmarkerInstance | null>(null)
  const timersRef = useRef<Record<string, number>>({})
  const lastLoggedRef = useRef<Record<string, number>>({})
  const baselineRef = useRef<{ x: number; y: number; width: number } | null>(null)
  const lastVideoTimeRef = useRef(-1)
  const onViolationRef = useRef(onViolation)
  const [status, setStatus] = useState<DetectorStatus>("idle")
  const [faceCount, setFaceCount] = useState(0)
  const [error, setError] = useState("")
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    onViolationRef.current = onViolation
  }, [onViolation])

  useEffect(() => {
    onStatusChange?.(enabled ? status : "idle")
  }, [enabled, status, onStatusChange])

  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    localVideoRef.current = element
    videoRef(element)
  }, [videoRef])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let intervalId: number | null = null

    const releaseDetector = () => {
      try {
        detectorRef.current?.close()
      } catch {
        // A failed WASM instance can also throw while being released.
      }
      detectorRef.current = null
    }

    const failDetector = (message: string) => {
      if (cancelled) return
      if (intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }
      releaseDetector()
      setError(message)
      setStatus("error")
    }

    const record = (
      type: string,
      description: string,
      severity: MotionViolation["severity"],
      duration: number,
    ) => {
      const now = Date.now()
      if (now - (lastLoggedRef.current[type] ?? 0) < cooldownMs) return
      lastLoggedRef.current[type] = now
      setLastEvent(type)
      onViolationRef.current({ type, description, severity, duration })
    }

    const sustain = (
      key: string,
      condition: boolean,
      description: string,
      severity: MotionViolation["severity"],
    ) => {
      const now = Date.now()
      if (!condition) {
        delete timersRef.current[key]
        return
      }
      timersRef.current[key] ??= now
      const elapsed = now - timersRef.current[key]
      if (elapsed >= holdMs) record(key, description, severity, Math.round(elapsed / 1000))
    }

    async function startDetector() {
      setStatus("loading")
      setError("")

      try {
        const vision = await import("@mediapipe/tasks-vision")
        if (cancelled) return
        const files = await withTimeout(
          vision.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
          ),
          DETECTOR_LOAD_TIMEOUT_MS,
        )
        if (cancelled) return

        const options = {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO" as const,
          numFaces: 3,
          minFaceDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        }

        try {
          detectorRef.current = await withTimeout(
            vision.FaceLandmarker.createFromOptions(files, {
              ...options,
              baseOptions: { ...options.baseOptions, delegate: "GPU" },
            }) as Promise<FaceLandmarkerInstance>,
            DETECTOR_LOAD_TIMEOUT_MS,
          )
        } catch {
          detectorRef.current = await withTimeout(
            vision.FaceLandmarker.createFromOptions(files, {
              ...options,
              baseOptions: { ...options.baseOptions, delegate: "CPU" },
            }) as Promise<FaceLandmarkerInstance>,
            DETECTOR_LOAD_TIMEOUT_MS,
          )
        }

        if (cancelled) {
          releaseDetector()
          return
        }

        intervalId = window.setInterval(() => {
          const video = localVideoRef.current
          if (!video || video.readyState < 2 || !detectorRef.current) return
          if (video.currentTime === lastVideoTimeRef.current) return
          lastVideoTimeRef.current = video.currentTime

          let faces: Array<Array<{ x: number; y: number; z: number }>>
          try {
            faces = detectorRef.current.detectForVideo(video, performance.now()).faceLandmarks
          } catch {
            failDetector("Motion analysis stopped unexpectedly. Select Retry detector to restart it; your camera feed remains available to the proctor.")
            return
          }
          setStatus(current => current === "active" ? current : "active")
          setFaceCount(faces.length)
          sustain("No face detected", detectFaceAbsence && faces.length === 0, "No face was visible for several seconds.", "high")
          sustain("Multiple faces detected", detectMultipleFaces && faces.length > 1, "More than one face was visible in the camera frame.", "high")
          if (faces.length !== 1) return

          const face = faces[0]
          if (face.length <= 263) {
            failDetector("The motion model returned incomplete face data. Select Retry detector to reload it.")
            return
          }
          const xs = face.map((point) => point.x)
          const ys = face.map((point) => point.y)
          const box = {
            x: (Math.min(...xs) + Math.max(...xs)) / 2,
            y: (Math.min(...ys) + Math.max(...ys)) / 2,
            width: Math.max(...xs) - Math.min(...xs),
          }
          baselineRef.current ??= box

          const nose = face[1]
          const leftEye = face[33]
          const rightEye = face[263]
          const eyeMidX = (leftEye.x + rightEye.x) / 2
          const eyeMidY = (leftEye.y + rightEye.y) / 2
          const eyeDistance = Math.max(0.01, Math.abs(rightEye.x - leftEye.x))
          const yaw = (nose.x - eyeMidX) / eyeDistance
          const pitch = (nose.y - eyeMidY) / Math.max(0.01, box.width)

          sustain("Looking left", detectGaze && yaw < -0.16, "Sustained head movement indicated attention to the left.", "warning")
          sustain("Looking right", detectGaze && yaw > 0.16, "Sustained head movement indicated attention to the right.", "warning")
          sustain("Looking up", detectGaze && pitch < 0.22, "Sustained head movement indicated attention above the screen.", "warning")
          sustain("Looking down", detectGaze && pitch > 0.38, "Sustained head movement indicated attention below the screen.", "warning")

          const baseline = baselineRef.current
          sustain(
            "Large posture change",
            detectPosture && (Math.abs(box.x - baseline.x) > 0.18 ||
              Math.abs(box.y - baseline.y) > 0.16 ||
              box.width < baseline.width * 0.55),
            "A sustained, large change in the candidate's position was detected.",
            "warning",
          )
        }, 500)
      } catch {
        if (cancelled) return
        failDetector(navigator.onLine === false
          ? "Motion analysis could not load while offline. Restore your connection, then select Retry detector."
          : "Motion analysis could not start. Select Retry detector to reload it; your camera feed remains available to the proctor.")
      }
    }

    void startDetector()
    return () => {
      cancelled = true
      if (intervalId !== null) window.clearInterval(intervalId)
      releaseDetector()
      baselineRef.current = null
      lastVideoTimeRef.current = -1
      timersRef.current = {}
    }
  }, [enabled, holdMs, cooldownMs, detectFaceAbsence, detectMultipleFaces, detectGaze, detectPosture, retryKey])

  const statusLabel = status === "active"
    ? faceCount === 1 ? "Face in frame" : `${faceCount} faces detected`
    : status === "loading" ? "Starting detector..."
    : status === "error" ? "Detector unavailable"
    : "Waiting for exam session"

  return (
    <aside className="fixed bottom-4 right-4 z-40 w-52 overflow-hidden rounded-2xl border border-emerald-400/70 bg-white shadow-2xl shadow-slate-900/20">
      <div className="relative aspect-video bg-slate-950">
        <video ref={setVideoRef} className="h-full w-full scale-x-[-1] object-cover" autoPlay playsInline muted />
        <div className="absolute inset-[10%] rounded-[28%] border border-white/20">
          <span className="absolute -left-px -top-px h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-emerald-400" />
          <span className="absolute -bottom-px -right-px h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-emerald-400" />
        </div>
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-slate-950/75 px-2 py-1 backdrop-blur-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "animate-pulse bg-emerald-400" : status === "error" ? "bg-rose-400" : "animate-pulse bg-amber-400"}`} />
          <span className="text-[8px] font-black uppercase tracking-wider text-white">Proctor live</span>
        </div>
        {status !== "active" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-white">
            {status === "error" ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6 animate-pulse" />}
          </div>
        )}
      </div>
      <div className="space-y-2.5 p-3">
        <div className="flex items-start gap-2">
          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${status === "active" ? "bg-emerald-50 text-emerald-600" : status === "error" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
            {status === "error" ? <AlertTriangle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-800">{statusLabel}</p>
            <p className="text-[9px] leading-3.5 text-slate-400">{error || "Movement is analyzed during the final exam."}</p>
            {status === "error" && (
              <button
                type="button"
                onClick={() => setRetryKey(value => value + 1)}
                className="mt-1 text-[10px] font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
              >
                Retry detector
              </button>
            )}
          </div>
        </div>
        {lastEvent && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[9px] font-semibold text-amber-700">
            <ScanFace className="h-3 w-3 shrink-0" /> Last event: {lastEvent}
          </div>
        )}
      </div>
    </aside>
  )
}
