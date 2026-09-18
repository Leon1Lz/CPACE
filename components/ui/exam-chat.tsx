"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MessageCircle, X, Send, ShieldCheck, GraduationCap } from "lucide-react"
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

export function ExamChat({ sessionId, currentUserId, currentUserRole, show }: ExamChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const isProctor = currentUserRole === "PROCTOR" || currentUserRole === "ADMIN"

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      if (!res.ok) return
      const data: ChatMessage[] = await res.json()
      setMessages(prev => {
        const prevIds = new Set(prev.map(m => m.id))
        const newMsgs = data.filter(m => !prevIds.has(m.id))
        if (!open) {
          const newUnread = newMsgs.filter(m => m.sender.id !== currentUserId).length
          if (newUnread > 0) setUnread(u => u + newUnread)
        }
        return data
      })
    } catch {
      // silently ignore errors
    }
  }, [sessionId, open, currentUserId])

  // Start/stop Pusher subscription
  useEffect(() => {
    if (!show || !sessionId) return
    
    // Initial fetch of message history
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
      setMessages(prev => {
        // Prevent duplication
        if (prev.some(m => m.id === newMsg.id)) return prev
        
        // Update unread count
        if (newMsg.sender.id !== currentUserId) {
          const isProctorMsg = newMsg.sender.role === "PROCTOR" || newMsg.sender.role === "ADMIN"
          
          // Trigger toast outside state updater to avoid rendering side-effects
          setTimeout(() => {
            toast({
              title: isProctorMsg ? "Message from Proctor 🛡️" : `Message from ${newMsg.sender.firstName} 💬`,
              description: newMsg.message,
            })
          }, 0)

          if (!open) {
            setUnread(u => u + 1)
          } else {
            // Trigger reading state sync on backend
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
  }, [show, sessionId, currentUserId, open, fetchMessages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  const sendMessage = async () => {
    if (!draft.trim() || !sessionId || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: draft.trim() }),
      })
      if (res.ok) {
        const newMsg: ChatMessage = await res.json()
        setMessages(prev => [...prev, newMsg])
        setDraft("")
        inputRef.current?.focus()
      }
    } finally {
      setSending(false)
    }
  }

  if (!show || !sessionId) return null

  return (
    <>
      {/* FAB Button to toggle drawer */}
      <button
        id="chat-fab"
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 left-72 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 ring-4 ring-violet-300/30 ${
          open ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        }`}
        aria-label="Open Proctor Chat"
        title="Proctor Chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[11px] font-black flex items-center justify-center animate-bounce">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Slide-out Sidebar Drawer */}
      <div
        id="exam-chat"
        className={`fixed top-4 bottom-4 right-4 w-[320px] md:w-[360px] bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[-10px_0_40px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0 pointer-events-none"
        }`}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between bg-[#2d1b69] px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            {isProctor
              ? <ShieldCheck className="h-4 w-4 text-violet-300" />
              : <GraduationCap className="h-4 w-4 text-[#a78bfa]" />
            }
            <span className="text-white text-xs font-bold tracking-wide">
              {isProctor ? "Examinee Chat" : "Proctor Chat"}
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition"
            title="Close Chat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="bg-[#121222]/90 flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <MessageCircle className="h-10 w-10 text-violet-400/40 mb-3" />
              <p className="text-violet-300/60 text-xs px-4 leading-relaxed">
                {isProctor
                  ? "No messages yet. You can message the examinee here."
                  : "You can ask your proctor a question here."}
              </p>
            </div>
          ) : messages.map((msg) => {
            const isMine = msg.sender.id === currentUserId
            const isProctorMsg = msg.sender.role === "PROCTOR" || msg.sender.role === "ADMIN"
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isProctorMsg ? "bg-violet-500" : "bg-emerald-500"}`}>
                      {isProctorMsg
                        ? <ShieldCheck className="h-2 w-2 text-white" />
                        : <GraduationCap className="h-2 w-2 text-white" />
                      }
                    </span>
                    <span className="text-[10px] text-violet-300/70 font-medium">
                      {isProctorMsg ? "Proctor" : `${msg.sender.firstName}`}
                    </span>
                  </div>
                )}
                <div className={`max-w-[240px] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  isMine
                    ? "bg-violet-600 text-white rounded-tr-sm"
                    : "bg-white/10 text-white/90 rounded-tl-sm"
                }`}>
                  {msg.message}
                </div>
                <span className="text-[9px] text-white/30 mt-1 px-1">
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-[#121222] border-t border-white/10 px-4 py-3.5 flex gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={isProctor ? "Message examinee..." : "Ask your proctor..."}
            className="flex-1 bg-white/10 text-white text-xs placeholder-white/30 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-violet-400 border border-white/5"
          />
          <button
            onClick={sendMessage}
            disabled={!draft.trim() || sending}
            className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}
