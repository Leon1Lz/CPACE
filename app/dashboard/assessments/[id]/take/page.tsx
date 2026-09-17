"use client"

import { useState, useEffect, useCallback, use, useRef } from "react"
import { useAssessmentAutosave } from "@/lib/use-assessment-autosave"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Award, AlertTriangle, Loader2, Flag, ClipboardList, Camera, RefreshCw,
  Download, FileText, Eye, X as XIcon
} from "lucide-react"

import { FloatingCalculator } from "@/components/ui/floating-calculator"
import { ExamChat } from "@/components/ui/exam-chat"
import { ExamMotionMonitor, type MotionViolation } from "@/components/proctoring/exam-motion-monitor"
import { LearnerVideoBroadcaster } from "@/components/proctoring/learner-video-broadcaster"

type Option = { id: string; text: string; isCorrect?: boolean; order: number }
type Question = { id: string; question: string; type: string; points: number; order: number; options: Option[] }
type Assessment = {
  id: string; title: string; description: string; type: string
  timeLimit: number | null; attempts: number | null; passingScore: number
  startsAt?: string | null; endsAt?: string | null
  course: { id: string; title: string }
  questions: Question[]
  _count: { results: number }
  materialUrl?: string | null
  materialName?: string | null
  motionDetectionEnabled?: boolean
  detectFaceAbsence?: boolean
  detectMultipleFaces?: boolean
  detectGaze?: boolean
  detectPosture?: boolean
  detectionHoldMs?: number
  detectionCooldownMs?: number
  evidenceCaptureEnabled?: boolean
  evidenceRetentionDays?: number
  requireProctoringConsent?: boolean
}

type AnswerMap = Record<string, { selectedOptionId?: string; content?: string }>

export default function TakeAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const currentUserId = (session?.user as any)?.id ?? ""
  const currentUserRole = (session?.user as any)?.role ?? "LEARNER"

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [phase, setPhase] = useState<"intro" | "taking" | "submitting" | "result">("intro")
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [startedAt, setStartedAt] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null)
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const autosave = useAssessmentAutosave(id, sessionId, answers, phase === "taking")
  const submissionInFlight = useRef(false)
  
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [capturedIdPhoto, setCapturedIdPhoto] = useState<string | null>(null)
  const [activeVerifyStep, setActiveVerifyStep] = useState<"face" | "id">("face")
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [proctoringConsent, setProctoringConsent] = useState(false)
  const [calibrationStatus, setCalibrationStatus] = useState<"idle" | "checking" | "passed" | "warning">("idle")
  const [calibrationMessage, setCalibrationMessage] = useState("Run the camera check before starting your exam.")
  const [startingExam, setStartingExam] = useState(false)
  const [startError, setStartError] = useState("")
  const [isFsLocked, setIsFsLocked] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [materialViewerOpen, setMaterialViewerOpen] = useState(false)
  const isFinal = assessment?.type === "FINAL_EXAM"

  const flagExamSession = useCallback(async (reason: string) => {
    if (!sessionId) return
    try {
      const response = await fetch(`/api/assessments/${id}/session`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, flagged: true, flagReason: reason }),
      })
      if (!response.ok) throw new Error("Session flag request failed")
    } catch (error) {
      console.error("Failed to flag session:", error)
    }
  }, [id, sessionId])

  const handleMotionViolation = useCallback((violation: MotionViolation) => {
    void flagExamSession(
      `[${violation.severity.toUpperCase()}] ${violation.type}: ${violation.description} (${violation.duration}s)`,
    )
  }, [flagExamSession])

  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (el && streamRef.current) {
      if (el.srcObject !== streamRef.current) {
        el.srcObject = streamRef.current
        el.play().catch(() => {})
      }
    }
  }, [])

  const startCamera = async () => {
    setCameraError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      streamRef.current = stream
      setCameraActive(true)
    } catch (err) {
      console.error("Camera access failed:", err)
      setCameraError(true)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = 320
      canvas.height = 240
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240)
        const dataUrl = canvas.toDataURL("image/jpeg")
        if (activeVerifyStep === "face") {
          setCapturedPhoto(dataUrl)
          setActiveVerifyStep("id")
        } else {
          setCapturedIdPhoto(dataUrl)
          if (!isFinal) {
            stopCamera()
          }
        }
      }
    }
  }

  const simulateMockPhoto = () => {
    const canvas = document.createElement("canvas")
    canvas.width = 320
    canvas.height = 240
    const ctx = canvas.getContext("2d")
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 320, 240)
      grad.addColorStop(0, "#10b981")
      grad.addColorStop(1, "#047857")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 320, 240)
      ctx.strokeStyle = "rgba(255,255,255,0.2)"
      ctx.lineWidth = 4
      ctx.strokeRect(20, 20, 280, 200)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(activeVerifyStep === "face" ? "VERIFIED CANDIDATE" : "GOVERNMENT ID CARD", 160, 100)
      ctx.font = "12px sans-serif"
      ctx.fillText(`ID: CPACE-${currentUserId.slice(0, 8).toUpperCase()}`, 160, 130)
      ctx.font = "bold 10px sans-serif"
      ctx.fillStyle = "#a7f3d0"
      ctx.fillText("SNAPSHOT SIMULATION SUCCESS", 160, 165)
      const dataUrl = canvas.toDataURL("image/jpeg")
      if (activeVerifyStep === "face") {
        setCapturedPhoto(dataUrl)
        setActiveVerifyStep("id")
      } else {
        setCapturedIdPhoto(dataUrl)
        setCalibrationStatus("passed")
        setCalibrationMessage("Simulation camera check passed for testing.")
        if (!isFinal) {
          stopCamera()
        }
      }
    }
  }

  const runCalibration = async () => {
    setCalibrationStatus("checking")
    setCalibrationMessage("Checking camera, framing, and lighting…")
    if (!streamRef.current) await startCamera()

    window.setTimeout(() => {
      const video = videoRef.current
      const track = streamRef.current?.getVideoTracks()[0]
      if (!video || !track || track.readyState !== "live" || video.readyState < 2) {
        setCalibrationStatus("warning")
        setCalibrationMessage("Camera is not ready. Allow camera access, keep this tab visible, and try again.")
        return
      }

      const canvas = document.createElement("canvas")
      canvas.width = 80
      canvas.height = 60
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(video, 0, 0, 80, 60)
      const pixels = ctx.getImageData(0, 0, 80, 60).data
      let brightness = 0
      for (let index = 0; index < pixels.length; index += 4) {
        brightness += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
      }
      brightness /= pixels.length / 4

      if (brightness < 40) {
        setCalibrationStatus("warning")
        setCalibrationMessage("The image is too dark. Face a light source and run the check again.")
      } else if (brightness > 225) {
        setCalibrationStatus("warning")
        setCalibrationMessage("The image is overexposed. Reduce direct light and run the check again.")
      } else {
        setCalibrationStatus("passed")
        setCalibrationMessage("Camera and lighting check passed. Keep your face centered during the exam.")
      }
    }, 900)
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])


  useEffect(() => {
    fetch(`/api/assessments/${id}`).then(async r => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || "Unable to load this assessment")
      return data
    }).then(data => {
      setAssessment(data)
      setAttemptCount(data._count?.results ?? 0)
    }).catch(error => setLoadError(error instanceof Error ? error.message : "Unable to load this assessment")).finally(() => setLoading(false))
  }, [id])

  const handleSubmit = useCallback(async () => {
    if (!assessment || submissionInFlight.current) return
    submissionInFlight.current = true
    setSubmitError(null)
    setPhase("submitting")
    const payload = assessment.questions.map(q => ({
      questionId: q.id,
      ...answers[q.id],
    }))
    try {
      const res = await fetch(`/api/assessments/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload, startedAt, sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Assessment submission was not saved")
      setResult(data)
      setPhase("result")
      stopCamera()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed. Your answers are still available; please retry.")
      setPhase("taking")
    } finally {
      submissionInFlight.current = false
    }
  }, [assessment, answers, id, startedAt, sessionId])

  // Live face feedback to proctor during final exam
  useEffect(() => {
    if (phase !== "taking" || !isFinal || !sessionId) return

    let activeStream: MediaStream | null = streamRef.current
    
    const ensureCamera = async () => {
      if (!activeStream) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
          streamRef.current = stream
          activeStream = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
        } catch (err) {
          console.error("Failed to restore camera during taking:", err)
        }
      } else {
        if (videoRef.current && videoRef.current.srcObject !== activeStream) {
          videoRef.current.srcObject = activeStream
          videoRef.current.play().catch(() => {})
        }
      }
    }

    ensureCamera()

    const interval = setInterval(async () => {
      if (videoRef.current) {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = 160
          canvas.height = 120
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 160, 120)
            const snapshot = canvas.toDataURL("image/jpeg", 0.6)
            await fetch(`/api/assessments/${id}/session/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                snapshot,
                cameraStatus: streamRef.current?.getVideoTracks()[0]?.readyState === "live" ? "CONNECTED" : "DISCONNECTED",
                detectorStatus: assessment.motionDetectionEnabled === false ? "DISABLED" : "ACTIVE",
              })
            })
          }
        } catch (err) {
          console.error("Failed to push live webcam snap:", err)
        }
      }
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [phase, isFinal, sessionId, id, assessment?.motionDetectionEnabled])

  // Sync stream to video ref whenever rendering phases or camera states change
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current
        videoRef.current.play().catch(() => {})
      }
    }
  }, [cameraActive, phase])

  // Countdown timer
  useEffect(() => {
    if (phase !== "taking" || timeLeft === null) return
    if (timeLeft <= 0) {
      if (!submitError) void handleSubmit()
      return
    }
    const t = setTimeout(() => setTimeLeft(deadlineAt ? Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 1000)) : null), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, handleSubmit, submitError, deadlineAt])

  // Browser Lock: Fullscreen and Focus/Visibility violations detection
  useEffect(() => {
    if (phase !== "taking") return

    let warningCount = 0

    const flagSession = async (reason: string) => {
      if (!sessionId) return
      try {
        await fetch(`/api/assessments/${id}/session`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, flagged: true, flagReason: reason }),
        })
      } catch (err) {
        console.error("Failed to flag session:", err)
      }
    }

    const handleFullscreenChange = () => {
      if (document.fullscreenElement === null) {
        warningCount++
        flagSession(`Exited Fullscreen mode (Violation #${warningCount})`)
        setIsFsLocked(true)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        warningCount++
        flagSession(`Tab/window switched — lost focus (Violation #${warningCount})`)
        if (isFinal) {
          setIsFsLocked(true)
        }
      }
    }

    const handleBlur = () => {
      warningCount++
      flagSession(`Window lost focus (Violation #${warningCount})`)
      if (isFinal) {
        setIsFsLocked(true)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
    }
  }, [phase, sessionId, id, isFinal])

  // Prevent closing, reloading or navigating away from tab during active exam
  useEffect(() => {
    if (phase !== "taking") return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Exam in progress! Leaving this page will abandon or submit your active attempt."
      return e.returnValue
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [phase])

  // Prevent copying, cutting, pasting, and context menu (right-click)
  useEffect(() => {
    if (phase !== "taking") return

    const blockEvent = (e: Event) => e.preventDefault()

    document.addEventListener("copy", blockEvent)
    document.addEventListener("cut", blockEvent)
    document.addEventListener("paste", blockEvent)
    document.addEventListener("contextmenu", blockEvent)

    return () => {
      document.removeEventListener("copy", blockEvent)
      document.removeEventListener("cut", blockEvent)
      document.removeEventListener("paste", blockEvent)
      document.removeEventListener("contextmenu", blockEvent)
    }
  }, [phase])

  // Block Developer Tools and standard cheats shortcuts
  useEffect(() => {
    if (phase !== "taking") return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault()
        alert("Developer Options are disabled during examinations.")
        return
      }
      if (e.key === "PrintScreen") {
        e.preventDefault()
        alert("Screen capture controls are disabled.")
        return
      }
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "i" || e.key === "j")) {
        e.preventDefault()
        alert("Developer tools are disabled.")
        return
      }
      if (e.ctrlKey && (e.key === "c" || e.key === "C" || e.key === "v" || e.key === "V" || e.key === "u" || e.key === "U")) {
        e.preventDefault()
        alert("Copying, pasting, and viewing page source are disabled.")
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, assessment?.type])


  const startExam = async () => {
    setStartingExam(true)
    setStartError("")
    let trackingReady = false
    // Create ExamSession so proctor can monitor
    try {
      const res = await fetch(`/api/assessments/${id}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityPhoto: capturedPhoto || undefined,
          idPhoto: capturedIdPhoto || undefined,
          proctoringConsent,
        })
      })
      if (res.ok) {
        const data = await res.json()
        setSessionId(data.sessionId)
        setStartedAt(data.startedAt)
        setAnswers(data.answers ?? {})
        autosave.restore(data.version ?? 0, data.answers ?? {})
        setDeadlineAt(data.deadlineAt ?? null)
        setTimeLeft(data.deadlineAt ? Math.max(0, Math.ceil((new Date(data.deadlineAt).getTime() - Date.now()) / 1000)) : null)
        trackingReady = true

        // Request Fullscreen for Final Exam
        if (assessment?.type === "FINAL_EXAM") {
          try {
            await document.documentElement.requestFullscreen()
          } catch (fullscreenError) {
            console.error("Fullscreen request failed:", fullscreenError)
          }
        }
      } else {
        const result = await res.json().catch(() => ({}))
        throw new Error(result.error || "Unable to start the monitored exam session")
      }
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Unable to start the monitored exam session")
      setStartingExam(false)
      return
    }

    if (!isFinal || trackingReady) {
      setPhase("taking")
    }
    setStartingExam(false)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const answered = Object.keys(answers).length
  const total = assessment?.questions.length ?? 0
  const progress = total > 0 ? (answered / total) * 100 : 0

  const isPractice = assessment?.type === "PRACTICE_EXAM"
  const attemptsLeft = assessment?.attempts != null ? assessment.attempts - attemptCount : null
  const canRetake = isPractice || (isFinal && (attemptsLeft === null || attemptsLeft > 0))

  const typeColors: Record<string, string> = {
    PRACTICE_EXAM: "bg-blue-100 text-blue-700",
    FINAL_EXAM: "bg-rose-100 text-rose-700",
    QUIZ: "bg-amber-100 text-amber-700",
  }
  const typeLabels: Record<string, string> = {
    PRACTICE_EXAM: "Practice Exam",
    FINAL_EXAM: "Final Exam",
    QUIZ: "Quiz",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!assessment) {
    return <div className="text-center py-20"><p role="alert" className="mx-auto max-w-lg text-gray-500">{loadError || "Assessment not found."}</p><Button onClick={() => router.push("/dashboard/learning-paths")} className="mt-4 rounded-xl bg-[#105C2E] hover:bg-[#0B4523]">View my learning paths</Button></div>
  }

  if (isFsLocked && isFinal) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl text-center p-8 rounded-3xl bg-white space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-rose-600 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 font-mono">Exam Lockout Protocol</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tab switching, leaving the exam window, or exiting full-screen mode is a security violation. Going to other tabs (including reviewer materials) is prohibited. This violation has been logged and sent to your proctor. You must re-enter full-screen mode to resume.
            </p>
          </div>
          <Button
            onClick={async () => {
              try {
                await document.documentElement.requestFullscreen()
                setIsFsLocked(false)
              } catch {
                alert("Please click the button again to request fullscreen access.")
              }
            }}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 font-semibold"
          >
            Re-Enter Fullscreen to Resume
          </Button>
        </Card>
      </div>
    )
  }


  // ── INTRO ──────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${typeColors[assessment.type] ?? "bg-gray-100 text-gray-600"}`}>
            {typeLabels[assessment.type] ?? assessment.type}
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-3">{assessment.title}</h1>
          <p className="text-gray-500 mt-1">{assessment.course.title}</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Exam Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Questions", value: assessment.questions.length },
                ...(assessment.startsAt ? [{ label: "Opens", value: new Date(assessment.startsAt).toLocaleString() }] : []),
                ...(assessment.endsAt ? [{ label: "New attempts close", value: new Date(assessment.endsAt).toLocaleString() }] : []),
                ...(assessment.type !== "REVIEWER" && assessment.type !== "RULES_GUIDELINES" ? [{ label: "Passing Score", value: `${assessment.passingScore}%` }] : []),
                ...(assessment.type !== "REVIEWER" && assessment.type !== "RULES_GUIDELINES" ? [{ label: "Time Limit", value: assessment.timeLimit ? `${assessment.timeLimit} min` : "No limit" }] : []),
                ...(assessment.type !== "REVIEWER" && assessment.type !== "RULES_GUIDELINES" ? [{ label: "Attempts", value: isPractice ? "Unlimited" : (assessment.attempts ?? 1) }] : []),
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>

            {assessment.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{assessment.description}</p>
            )}

            {assessment.materialUrl && (
              <>
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-lg font-bold text-xs uppercase shrink-0">
                      {assessment.materialName?.split(".").pop() ?? "FILE"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">Study Material Attached</p>
                      <p className="text-xs text-gray-500 truncate">{assessment.materialName}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setMaterialViewerOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> View Material
                  </Button>
                </div>

                {/* Inline Material Viewer Dialog */}
                <Dialog open={materialViewerOpen} onOpenChange={setMaterialViewerOpen}>
                  <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 rounded-2xl overflow-hidden [&>button]:hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-lg font-bold text-[10px] uppercase shrink-0">
                          {assessment.materialName?.split(".").pop() ?? "FILE"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{assessment.materialName}</p>
                          <p className="text-[10px] text-gray-400">Study Material</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-8">
                          <a href={assessment.materialUrl} download>
                            <Download className="h-3 w-3" /> Download
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setMaterialViewerOpen(false)} className="rounded-xl h-8 w-8 p-0">
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-900 relative" style={{ height: 'calc(90vh - 56px)' }}>
                      {assessment.materialName?.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={assessment.materialUrl}
                          className="w-full h-full border-0"
                          title="Material Viewer"
                        />
                      ) : (
                        <iframe
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + assessment.materialUrl)}&embedded=true`}
                          className="w-full h-full border-0"
                          title="Material Viewer"
                          onError={() => {}}
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {isFinal && (
              <>
                <div className="flex gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-rose-700 space-y-1">
                    <div>
                      <strong>Final Exam Protocol:</strong> Passing this exam will automatically issue your certificate.
                      {attemptsLeft !== null && <span> You have <strong>{attemptsLeft}</strong> attempt{attemptsLeft !== 1 ? "s" : ""} remaining.</span>}
                    </div>
                    <div className="text-xs text-rose-600 font-medium">
                      🔒 <strong>Strict Page &amp; Tab Lockout:</strong> Tab switching, leaving the exam window, or attempting to open reviewer materials is strictly monitored. Switching tabs will lock the exam page and trigger a real-time proctor alert.
                    </div>
                  </div>
                </div>

                <Card className="border border-gray-100 bg-gray-50/50 rounded-2xl overflow-hidden shadow-inner">
                  <CardHeader className="pb-2 bg-gray-50 border-b border-gray-100">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-800 justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-emerald-600" /> Identity Screening Verification
                      </div>
                      <div className="flex items-center gap-2 text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {!capturedPhoto ? "Step 1 of 2: Face Snap" : !capturedIdPhoto ? "Step 2 of 2: ID Upload" : "Complete"}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Step indicator */}
                    <div className="grid grid-cols-2 gap-2 text-center pb-2 border-b border-gray-200/50">
                      <div className={`py-1.5 rounded-lg text-xs font-bold ${!capturedPhoto ? "bg-emerald-600 text-white shadow-sm" : "bg-emerald-100 text-emerald-800"}`}>
                        1. Face Snapshot {!capturedPhoto ? "📷" : "✅"}
                      </div>
                      <div className={`py-1.5 rounded-lg text-xs font-bold ${capturedPhoto && !capturedIdPhoto ? "bg-emerald-600 text-white shadow-sm" : capturedIdPhoto ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"}`}>
                        2. Government ID {capturedIdPhoto ? "✅" : "💳"}
                      </div>
                    </div>

                     {/* Camera view / Snapped photos display */}
                     <div className="flex flex-col items-center gap-4 w-full">
                        <div className={`relative w-[320px] h-[240px] bg-black rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md ${cameraActive && (!capturedPhoto || !capturedIdPhoto) ? 'block' : 'hidden'}`}>
                          <video 
                            ref={videoRefCallback} 
                            className="w-full h-full object-cover scale-x-[-1]" 
                            autoPlay 
                            playsInline 
                            muted 
                          />
                         <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                           <Button size="sm" onClick={capturePhoto} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl shadow-lg font-bold">
                             Capture {!capturedPhoto ? "Face Snapshot" : "ID Card Snap"} 📸
                           </Button>
                         </div>
                       </div>

                       <div className="w-full space-y-4">
                         {/* Snapshots previews if captured */}
                         <div className="flex flex-wrap gap-4 justify-center">
                           {capturedPhoto && (
                             <div className="flex flex-col items-center gap-1.5">
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Candidate Face</span>
                               <div className="relative w-[150px] h-[112px] rounded-xl overflow-hidden border border-emerald-200 shadow">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                 <img src={capturedPhoto} alt="Face snap" className="w-full h-full object-cover" />
                                 <button onClick={() => { setCapturedPhoto(null); setCapturedIdPhoto(null); setActiveVerifyStep("face"); }} className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow">
                                   <XIcon className="h-3 w-3" />
                                 </button>
                               </div>
                             </div>
                           )}

                           {capturedIdPhoto && (
                             <div className="flex flex-col items-center gap-1.5">
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Government ID</span>
                               <div className="relative w-[150px] h-[112px] rounded-xl overflow-hidden border border-emerald-200 shadow">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                 <img src={capturedIdPhoto} alt="ID snap" className="w-full h-full object-cover" />
                                 <button onClick={() => setCapturedIdPhoto(null)} className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow">
                                   <XIcon className="h-3 w-3" />
                                 </button>
                               </div>
                             </div>
                           )}
                         </div>

                         {/* Controls if camera not active */}
                         {(!cameraActive || (capturedPhoto && capturedIdPhoto)) && (!capturedPhoto || !capturedIdPhoto) && (
                           <div className="w-full text-center py-6 border border-dashed border-gray-300 rounded-2xl bg-white space-y-3">
                             <Camera className="h-8 w-8 text-gray-300 mx-auto" />
                             <div className="space-y-1">
                               <p className="text-xs font-bold text-gray-700">
                                 {!capturedPhoto ? "Webcam face snap is required" : "Government ID scan is required"}
                               </p>
                               <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                                 Please grant webcam permissions or simulate capture to continue.
                               </p>
                             </div>
                             <div className="flex gap-2 justify-center">
                               <Button size="sm" onClick={startCamera} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
                                 Enable Webcam
                               </Button>
                               <Button size="sm" variant="outline" onClick={simulateMockPhoto} className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-medium">
                                 Simulate Snap
                               </Button>
                             </div>
                             {cameraError && (
                               <p className="text-[10px] text-rose-500 font-medium px-4">
                                 ⚠️ Could not access webcam. Please verify browser permissions, or click "Simulate Snap" to bypass for testing.
                               </p>
                             )}
                           </div>
                         )}
                       </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-emerald-100 bg-emerald-50/40 rounded-2xl shadow-none">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Camera check &amp; proctoring privacy</h3>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">
                        Your camera is shared with authorized proctors during this exam. Automated motion alerts are indicators only and require human review before any action is taken.
                        {assessment.evidenceCaptureEnabled !== false
                          ? ` Flagged-event evidence may be retained for up to ${assessment.evidenceRetentionDays ?? 30} days.`
                          : " Evidence snapshots are disabled for this assessment."}
                      </p>
                    </div>

                    <div className={`rounded-xl border p-3 text-xs ${calibrationStatus === "passed" ? "border-emerald-200 bg-white text-emerald-700" : calibrationStatus === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-white text-gray-600"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span>{calibrationMessage}</span>
                        <Button type="button" size="sm" variant="outline" onClick={runCalibration} disabled={calibrationStatus === "checking"} className="shrink-0 rounded-lg text-xs">
                          {calibrationStatus === "checking" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Run Camera Check"}
                        </Button>
                      </div>
                    </div>

                    {assessment.requireProctoringConsent !== false && (
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={proctoringConsent}
                          onChange={(event) => setProctoringConsent(event.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-emerald-600"
                        />
                        <span>I understand and consent to live proctoring, automated motion analysis, and the evidence policy described above.</span>
                      </label>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {isPractice && (
              <div className="flex gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700"><strong>Practice Exam:</strong> Retake as many times as you need. Results don&apos;t affect your certificate.</p>
              </div>
            )}

            {assessment.questions.length === 0 ? (
              <div className="text-center py-4 text-amber-600 text-sm font-medium">
                <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
                No questions have been added yet.
              </div>
            ) : (
              <div className="space-y-2">
              {startError && <p className="rounded-xl bg-rose-50 p-3 text-center text-xs font-semibold text-rose-600">{startError}</p>}
              <Button
                onClick={startExam}
                disabled={startingExam || !canRetake || (isFinal && (!capturedPhoto || !capturedIdPhoto || calibrationStatus !== "passed" || (assessment.requireProctoringConsent !== false && !proctoringConsent)))}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-semibold"
              >
                {startingExam ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {!canRetake 
                  ? "No attempts remaining" 
                  : (isFinal && (!capturedPhoto || !capturedIdPhoto))
                    ? "Verify Identity & ID to Unlock"
                    : (isFinal && calibrationStatus !== "passed")
                      ? "Pass Camera Check to Unlock"
                      : (isFinal && assessment.requireProctoringConsent !== false && !proctoringConsent)
                        ? "Accept Proctoring Consent to Unlock"
                        : "Start Exam"}
              </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── TAKING ─────────────────────────────────────────────
  if (phase === "taking" && assessment.questions.length > 0) {
    const q = assessment.questions[current]
    const isFlagged = flagged.has(q.id)
    const answeredCount = Object.keys(answers).length
    const flaggedCount = flagged.size
    const unansweredCount = total - answeredCount

    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColors[assessment.type]}`}>
              {typeLabels[assessment.type] ?? assessment.type}
            </span>
            <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">{assessment.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1 rounded-xl ${timeLeft < 60 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <Button
              size="sm" variant="outline"
              onClick={() => setConfirmSubmit(true)}
              className="rounded-xl text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Submit
            </Button>
          </div>
        </div>

        {submitError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{submitError} Your answers have been kept on this page. Use Submit to retry.</p>}
        <p role="status" aria-live="polite" className="text-xs text-slate-600">{autosave.status}. The server enforces your original deadline. After time ends, only answers saved before the deadline are graded; unsaved changes cannot be recovered.</p>
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Question {current + 1} of {total}</span>
            <span>{answeredCount} of {total} answered</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Two-column layout: Question + Palette */}
        <div className="flex gap-4 items-start">

          {/* ── Left: Question Card ────────────────────────────────────── */}
          <div className="flex-1 space-y-4 min-w-0">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {current + 1}
                    </span>
                    <p className="text-gray-900 font-medium leading-relaxed">{q.question}</p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setFlagged(prev => { const n = new Set(prev); isFlagged ? n.delete(q.id) : n.add(q.id); return n })}
                    className={`h-8 w-8 rounded-xl shrink-0 ${isFlagged ? "text-amber-500 bg-amber-50" : "text-gray-300 hover:text-amber-400"}`}
                    title={isFlagged ? "Unflag question" : "Flag for review"}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>

                {(q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") && (
                  <div className="space-y-2.5 ml-10">
                    {q.options.map((opt) => {
                      const selected = answers[q.id]?.selectedOptionId === opt.id
                      return (
                        <button
                          key={opt.id}
                          disabled={timeLeft !== null && timeLeft <= 0}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: { selectedOptionId: opt.id } }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150 font-medium ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                              : "border-gray-100 bg-gray-50 text-gray-700 hover:border-emerald-200 hover:bg-emerald-50/40"
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 text-xs font-bold transition-all ${selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 text-gray-400"}`}>
                            {selected ? "✓" : String.fromCharCode(65 + q.options.indexOf(opt))}
                          </span>
                          {opt.text}
                        </button>
                      )
                    })}
                  </div>
                )}

                {(q.type === "SHORT_ANSWER" || q.type === "ESSAY") && (
                  <textarea
                    disabled={timeLeft !== null && timeLeft <= 0}
                    className="w-full ml-10 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    rows={4}
                    placeholder="Type your answer here..."
                    value={answers[q.id]?.content ?? ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: { content: e.target.value } }))}
                  />
                )}
              </CardContent>
            </Card>

            {/* Prev / Next nav */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrent(c => c - 1)} disabled={current === 0} className="rounded-xl gap-1.5">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {current < total - 1 ? (
                <Button onClick={() => setCurrent(c => c + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setConfirmSubmit(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  Finish
                </Button>
              )}
            </div>
          </div>

          {/* ── Right: Question Palette ────────────────────────────────── */}
          <div className="w-56 shrink-0 sticky top-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question Palette</p>

                {/* Grid of question numbers */}
                <div className="grid grid-cols-5 gap-1.5">
                  {assessment.questions.map((sq, i) => {
                    const isAnswered = !!answers[sq.id]
                    const isFlaggedQ = flagged.has(sq.id)
                    const isCurrent  = i === current
                    return (
                      <button
                        key={sq.id}
                        onClick={() => setCurrent(i)}
                        title={`Question ${i + 1}${ isAnswered ? " · Answered" : "" }${ isFlaggedQ ? " · Flagged" : "" }`}
                        className={`w-full aspect-square rounded-lg text-xs font-bold transition-all duration-150 ${
                          isCurrent   ? "ring-2 ring-emerald-500 bg-emerald-500 text-white scale-110 shadow" :
                          isAnswered && isFlaggedQ ? "bg-amber-400 text-white" :
                          isAnswered  ? "bg-emerald-500 text-white" :
                          isFlaggedQ  ? "bg-amber-100 text-amber-700 border border-amber-300" :
                                        "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  {[
                    { color: "bg-emerald-500", label: `Answered (${answeredCount})` },
                    { color: "bg-amber-100 border border-amber-300", label: `Flagged (${flaggedCount})` },
                    { color: "bg-gray-100",    label: `Unanswered (${unansweredCount})` },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-sm shrink-0 ${color}`} />
                      <span className="text-[11px] text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <Button
                  onClick={() => setConfirmSubmit(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                  size="sm"
                >
                  Submit Exam
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit confirmation */}
        <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
              <AlertDialogDescription>
                You have answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions.
                {answeredCount < total && <span className="text-amber-600"> {total - answeredCount} question{total - answeredCount > 1 ? "s" : ""} still unanswered.</span>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Review</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                Submit Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <FloatingCalculator show={true} />
        <ExamChat
          sessionId={sessionId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          show={true}
        />

        <LearnerVideoBroadcaster sessionId={sessionId} stream={streamRef.current} />

        {isFinal && (
          <ExamMotionMonitor
            enabled={cameraActive && !!sessionId && assessment.motionDetectionEnabled !== false}
            videoRef={videoRefCallback}
            onViolation={handleMotionViolation}
            config={{
              holdMs: assessment.detectionHoldMs,
              cooldownMs: assessment.detectionCooldownMs,
              detectFaceAbsence: assessment.detectFaceAbsence,
              detectMultipleFaces: assessment.detectMultipleFaces,
              detectGaze: assessment.detectGaze,
              detectPosture: assessment.detectPosture,
            }}
          />
        )}
      </div>
    )
  }

  // ── SUBMITTING ─────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-gray-500 font-medium">Submitting your answers…</p>
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────
  if (phase === "result" && result) {
    const isReviewer = assessment?.type === "REVIEWER"
    const passed = isReviewer ? true : result.passed
    const pendingReview = result.gradingPending ?? result.hasOpenEnded
    const scoresPendingRelease = result.scoresReleased === false

    if (scoresPendingRelease) {
      return (
        <div className="max-w-2xl mx-auto space-y-5">
          {result.timedOut && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Time ended. Your last server-saved answers were submitted; changes not saved before the deadline were not accepted.</p>}
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Clock className="h-10 w-10 text-white animate-spin" style={{ animationDuration: "6s" }} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900">Assessment Submitted Successfully</h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  {pendingReview ? "Your written answers are awaiting instructor grading. You will be notified after review; scores follow the assessment's release policy." : "Your answers have been securely logged. Scores are held until the instructor releases them."}
                </p>
              </div>
              <div className="pt-4 flex justify-center">
                <Button onClick={() => router.push("/dashboard/assessments")} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Back to Assessments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {result.timedOut && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Time ended. Your last server-saved answers were submitted; changes not saved before the deadline were not accepted.</p>}
        <Card className={`border-0 shadow-xl overflow-hidden`}>
          <div className={`h-2 w-full ${pendingReview ? "bg-gradient-to-r from-amber-400 to-orange-500" : isReviewer ? "bg-gradient-to-r from-blue-400 to-indigo-500" : passed ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-red-400 to-rose-500"}`} />
          <CardContent className="p-8 text-center space-y-4">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg ${pendingReview ? "bg-gradient-to-br from-amber-400 to-orange-500" : isReviewer ? "bg-gradient-to-br from-blue-500 to-indigo-600" : passed ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-red-500 to-rose-600"}`}>
              {pendingReview ? <ClipboardList className="h-10 w-10 text-white" /> : isReviewer ? <CheckCircle className="h-10 w-10 text-white" /> : passed ? <CheckCircle className="h-10 w-10 text-white" /> : <XCircle className="h-10 w-10 text-white" />}
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">{result.score.toFixed(1)}%</h2>
              <p className={`text-lg font-bold mt-1 ${pendingReview ? "text-amber-600" : isReviewer ? "text-blue-600" : passed ? "text-emerald-600" : "text-red-500"}`}>
                {pendingReview ? "Pending Review" : isReviewer ? "Review Completed!" : passed ? "Passed!" : "Not Passed"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {result.earnedPoints} / {result.totalPoints} points · Attempt #{result.attempt}
              </p>
            </div>

            {pendingReview && (
              <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-left">
                <ClipboardList className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  <strong>Manual Review Required:</strong> This assessment contains open-ended questions that need to be reviewed by your instructor before a final score is given.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-left">
              {!isReviewer && (
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-400">Passing Score</p>
                  <p className="font-bold text-gray-900">{assessment.passingScore}%</p>
                </div>
              )}
              <div className={`p-3 rounded-xl bg-gray-50 ${isReviewer ? "col-span-2 text-center" : ""}`}>
                <p className="text-xs text-gray-400">{isReviewer ? "Review Score" : "Your Score"}</p>
                <p className={`font-bold ${isReviewer ? "text-blue-600" : passed ? "text-emerald-600" : "text-red-500"}`}>{result.score.toFixed(1)}%</p>
              </div>
            </div>

            {result.certificate && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                <Award className="h-8 w-8 text-violet-600 shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-violet-900 text-sm">Certificate Issued!</p>
                  <p className="text-xs text-violet-600">{result.certificate.certificateNumber}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/assessments")} className="flex-1 rounded-xl">
                Back to Assessments
              </Button>
              {isPractice && (
                <Button
                  onClick={() => { setPhase("intro"); setAnswers({}); setCurrent(0); setFlagged(new Set()); setResult(null); setSessionId(null); setAttemptCount(c => c + 1) }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  Retake
                </Button>
              )}
              {result.certificate && (
                <Button onClick={() => router.push("/dashboard/certificates")} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                  View Certificate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── #9 Question Review ──────────────────────────────────────────── */}
        {isPractice && assessment.questions.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                Submission Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.questions.map((q, i) => {
                const userAnswer = answers[q.id]
                const hasMultiChoice = q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE"

                return (
                  <div key={q.id} className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 bg-gray-200 text-gray-600">{i + 1}</span>
                      <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.question}</p>
                      <span className="ml-auto shrink-0">
                        {!userAnswer
                          ? <span className="text-xs text-gray-400 font-medium">Not answered</span>
                          : <CheckCircle className="h-5 w-5 text-sky-500" />}
                      </span>
                    </div>

                    {hasMultiChoice && (
                      <div className="ml-9 space-y-1.5">
                        {q.options.map(opt => {
                          const isSelected = opt.id === userAnswer?.selectedOptionId
                          return (
                            <div key={opt.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                              isSelected ? "bg-sky-100 text-sky-800" : "text-gray-500"
                            }`}>
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isSelected ? "border-sky-500 bg-sky-500 text-white" : "border-gray-300"
                              }`}>
                                {isSelected ? "✓" : ""}
                              </span>
                              {opt.text}
                              {isSelected && <span className="ml-auto text-sky-700 font-semibold">Your answer</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {q.type === "SHORT_ANSWER" && userAnswer?.content && (
                      <div className="ml-9 mt-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">Your answer:</p>
                        <p className="text-sm text-gray-700 bg-white rounded-xl px-3 py-2 border border-gray-200">{userAnswer.content}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return null
}
