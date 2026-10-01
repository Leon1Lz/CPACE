"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  MessageCircle,
  X,
  Send,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Volume2,
  VolumeX,
  Minus,
  Maximize2,
  AlertCircle,
  Clock,
  Radio,
  HelpCircle,
} from "lucide-react"
import Pusher from "pusher-js"
import { useToast } from "@/hooks/use-toast"

export type ChatMessage = {
  id: string
  message: string
  sentAt: string
  isRead: boolean
  sender: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
}

interface ExamChatProps {
  sessionId: string | null
  currentUserId: string
  currentUserRole: string // "LEARNER" | "PROCTOR" | "ADMIN"
  show: boolean
}

// ── Quick Help Options ───────────────────────────────────────────────────────
const LEARNER_QUICK_OPTIONS = [
  {
    icon: "📷",
    label: "Camera Check",
    text: "Hello Proctor, could you confirm if my camera feed is clear and transmitting properly?",
  },
  {
    icon: "🌐",
    label: "Connection Alert",
    text: "My connection briefly fluctuated. Please verify that my exam session is connected and recorded.",
  },
  {
    icon: "❓",
    label: "Question Phrasing",
    text: "I have a question regarding the instructions or phrasing of this question.",
  },
  {
    icon: "🚻",
    label: "Restroom Request",
    text: "Requesting permission for a brief restroom break if permitted by proctor guidelines.",
  },
  {
    icon: "⏳",
    label: "Time Verification",
    text: "Can you confirm my remaining official examination time on your monitoring dashboard?",
  },
  {
    icon: "📝",
    label: "Submission Check",
    text: "I have finished answering all questions. Can you confirm everything is safely recorded before I submit?",
  },
]

const PROCTOR_QUICK_OPTIONS = [
  {
    icon: "👁️",
    label: "Look at Screen",
    text: "Please face forward and keep your attention focused on your examination screen.",
  },
  {
    icon: "📷",
    label: "Adjust Camera",
    text: "Please adjust your webcam so your full face and workspace are clearly visible.",
  },
  {
    icon: "🔇",
    label: "Silence Room",
    text: "Please ensure your testing environment remains quiet and free from background voices.",
  },
  {
    icon: "✅",
    label: "All Clear",
    text: "Your camera and connection are clear and verified. Proceed with your exam.",
  },
  {
    icon: "⏸️",
    label: "Pause & Breathe",
    text: "Everything is normal. Take your time and continue your assessment.",
  },
]

// Subtle chime synthesizer using Web Audio API
function playChime() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // ignore audio block
  }
}

export function ExamChat({ sessionId, currentUserId, currentUserRole, show }: ExamChatProps) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showQuickOptions, setShowQuickOptions] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const isProctor = currentUserRole === "PROCTOR" || currentUserRole === "ADMIN"
  const quickOptions = isProctor ? PROCTOR_QUICK_OPTIONS : LEARNER_QUICK_OPTIONS

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      if (!res.ok) return
      const data: ChatMessage[] = await res.json()
      setMessages((prev) => {
        const prevIds = new Set(prev.map((m) => m.id))
        const newMsgs = data.filter((m) => !prevIds.has(m.id))
        if (!open) {
          const newUnread = newMsgs.filter((m) => m.sender.id !== currentUserId).length
          if (newUnread > 0) setUnread((u) => u + newUnread)
        }
        return data
      })
    } catch {
      // silently ignore
    }
  }, [sessionId, open, currentUserId])

  // Pusher realtime subscription
  useEffect(() => {
    if (!show || !sessionId) return

    fetchMessages()

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || ""
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || ""

    if (!pusherKey || !pusherCluster) {
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

    channel.bind("new-message", (newMsg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev

        if (newMsg.sender.id !== currentUserId) {
          const isProctorMsg = newMsg.sender.role === "PROCTOR" || newMsg.sender.role === "ADMIN"

          if (soundEnabled) playChime()

          setTimeout(() => {
            toast({
              title: isProctorMsg ? "Official Proctor Message 🛡️" : `Message from ${newMsg.sender.firstName} 💬`,
              description: newMsg.message,
            })
          }, 0)

          if (!open) {
            setUnread((u) => u + 1)
          } else {
            fetch(`/api/chat?sessionId=${sessionId}`).catch(() => {})
          }
        }

        return [...prev, newMsg]
      })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [show, sessionId, currentUserId, open, soundEnabled, fetchMessages, toast])

  // Auto-scroll on new messages
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open, minimized])

  // Clear unread on open
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  const sendMessage = async (customText?: string) => {
    const textToSend = (customText ?? draft).trim()
    if (!textToSend || !sessionId || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: textToSend }),
      })
      if (res.ok) {
        const newMsg: ChatMessage = await res.json()
        setMessages((prev) => [...prev, newMsg])
        if (!customText) setDraft("")
        inputRef.current?.focus()
      }
    } finally {
      setSending(false)
    }
  }

  const handleQuickOptionClick = (optionText: string) => {
    setDraft(optionText)
    inputRef.current?.focus()
  }

  if (!show || !sessionId) return null

  // FAB Button
  if (!open) {
    return (
      <button
        id="chat-fab"
        onClick={() => {
          setOpen(true)
          setMinimized(false)
        }}
        className="fixed bottom-5 left-5 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-violet-500/20 group border border-violet-400/30"
        aria-label="Open Proctor Chat"
        title="Open Proctor Assistance Chat"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-600 border-2 border-white rounded-full text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    )
  }

  // Minimized Drawer Bar
  if (minimized) {
    return (
      <div
        id="exam-chat"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-slate-950/95 border border-violet-500/40 shadow-2xl px-4 py-2.5 backdrop-blur-md text-white cursor-pointer hover:border-violet-400 transition-all"
        onClick={() => setMinimized(false)}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-bold text-violet-200">
          {isProctor ? "Examinee Chat" : "Proctor Chat"}
        </span>
        {messages.length > 0 && (
          <span className="text-[11px] text-slate-400">
            ({messages.length} message{messages.length === 1 ? "" : "s"})
          </span>
        )}
        <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMinimized(false)
            }}
            className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
            title="Restore chat"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              setMinimized(false)
            }}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10"
            title="Close chat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Slide-out Sidebar Drawer */}
      <div
        id="exam-chat"
        className="fixed top-4 bottom-4 right-4 w-[min(380px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[-10px_0_40px_rgba(0,0,0,0.6)] z-50 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-right-4"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
                {isProctor ? (
                  <ShieldCheck className="h-4 w-4 text-violet-300" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-emerald-400" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white text-xs font-bold tracking-wide">
                  {isProctor ? "Examinee Assistance" : "Proctor Support"}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.2 rounded">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isProctor ? "Private proctor channel" : "Monitored & recorded channel"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Audio chime toggle */}
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className={`p-1.5 rounded-lg transition ${
                soundEnabled ? "text-violet-300 hover:bg-white/10" : "text-slate-500 hover:bg-white/10"
              }`}
              title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>

            {/* Minimize */}
            <button
              onClick={() => setMinimized(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
              title="Minimize chat"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
              title="Close chat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Security & Academic Integrity Banner */}
        <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-3.5 py-1.5 flex items-center justify-between shrink-0 text-[11px] text-emerald-200">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Encrypted live proctoring channel</span>
          </div>
          <button
            onClick={() => setShowQuickOptions((q) => !q)}
            className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:underline shrink-0 ml-2"
          >
            {showQuickOptions ? "Hide Options" : "Show Options"}
          </button>
        </div>

        {/* Quick Help Options Tray */}
        {showQuickOptions && (
          <div className="bg-slate-900/90 border-b border-white/10 p-2.5 shrink-0 max-h-36 overflow-y-auto">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                {isProctor ? "Proctor Quick Responses" : "Quick Assistance Options"}
              </span>
              <span className="text-[10px] text-slate-500">Tap to load</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickOptionClick(opt.text)}
                  className="rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-white/5 px-2 py-1 text-[11px] font-medium transition flex items-center gap-1 active:scale-95 text-left"
                  title={opt.text}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div className="bg-slate-950/80 flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mb-3 text-violet-400">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">
                {isProctor ? "Direct Examinee Channel" : "Official Proctor Channel"}
              </h4>
              <p className="text-slate-400 text-[11px] px-4 leading-relaxed max-w-[260px]">
                {isProctor
                  ? "Send instructions or clarification to the learner. Messages are saved in the exam audit trail."
                  : "Have an urgent question or technical difficulty? Type below or tap a quick option above."}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender.id === currentUserId
              const isProctorMsg = msg.sender.role === "PROCTOR" || msg.sender.role === "ADMIN"

              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  {!isMine && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isProctorMsg ? "bg-violet-600 text-white" : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isProctorMsg ? (
                          <ShieldCheck className="h-2.5 w-2.5" />
                        ) : (
                          <GraduationCap className="h-2.5 w-2.5" />
                        )}
                      </span>
                      <span className="text-[11px] text-slate-300 font-semibold">
                        {isProctorMsg ? "Exam Proctor" : `${msg.sender.firstName} ${msg.sender.lastName}`}
                      </span>
                    </div>
                  )}

                  <div
                    className={`max-w-[270px] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMine
                        ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-xs"
                        : "bg-slate-800/90 text-slate-100 border border-white/10 rounded-tl-xs"
                    }`}
                  >
                    {msg.message}
                  </div>

                  <span className="text-[9px] text-slate-400 mt-1 px-1">
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message Input Box */}
        <div className="bg-slate-900/95 border-t border-white/10 p-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void sendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={isProctor ? "Type message to examinee…" : "Message your proctor…"}
              maxLength={500}
              className="flex-1 bg-slate-950/80 text-white text-xs placeholder-slate-500 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/10 transition"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="w-9 h-9 rounded-xl bg-[#105C2E] hover:bg-emerald-600 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
