"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react"
import { Camera, Maximize2, Minimize2 } from "lucide-react"
import Pusher from "pusher-js"

type Signal = {
  id?: string
  createdAt?: string
  senderId: string
  targetId: string | null
  senderRole: "LEARNER" | "PROCTOR"
  type: "REQUEST" | "OFFER" | "ANSWER" | "ICE" | "CLOSE"
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null
}

export function ProctorVideoFeed({
  sessionId,
  fallbackSnapshot,
  candidateName,
  stale,
  compact = false,
  fit = "cover",
  className = "",
  showFullscreenButton = true,
}: {
  sessionId: string
  fallbackSnapshot: string | null
  candidateName: string
  stale: boolean
  compact?: boolean
  fit?: "cover" | "contain"
  className?: string
  showFullscreenButton?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<"connecting" | "live" | "fallback">(() => sessionId.startsWith("simulation-") ? "fallback" : "connecting")
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {})
    } else {
      void containerRef.current.requestFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (sessionId.startsWith("simulation-")) return

    const viewerId = crypto.randomUUID()
    let learnerId = ""
    let peer: RTCPeerConnection | null = null
    let stopped = false
    let requestTimer: number | null = null
    const pendingCandidates: RTCIceCandidateInit[] = []
    const channelName = `private-exam-session-${sessionId}`
    const seenSignals = new Set<string>()
    let since = new Date(Date.now() - 5_000).toISOString()
    const send = (type: Signal["type"], targetId: string | null, payload: Signal["payload"] = null) =>
      fetch("/api/proctor/webrtc-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, senderId: viewerId, targetId, type, payload }),
      }).catch(() => undefined)

    const handleSignal = async (signal: Signal) => {
      if (signal.senderRole !== "LEARNER" || signal.targetId !== viewerId) return
      try {
        if (signal.type === "OFFER" && signal.payload) {
          learnerId = signal.senderId
          peer?.close()
          peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] })
          peer.ontrack = (event) => {
            const stream = event.streams[0]
            setLiveStream(stream)
            setStatus("live")
            if (requestTimer !== null) window.clearInterval(requestTimer)
            requestTimer = null
          }
          peer.onicecandidate = (event) => {
            if (event.candidate) void send("ICE", learnerId, event.candidate.toJSON())
          }
          peer.onconnectionstatechange = () => {
            if (peer && ["failed", "closed", "disconnected"].includes(peer.connectionState)) setStatus("fallback")
          }
          await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
          for (const candidate of pendingCandidates.splice(0)) await peer.addIceCandidate(candidate)
          await peer.setLocalDescription(await peer.createAnswer())
          await send("ANSWER", learnerId, peer.localDescription?.toJSON() ?? null)
        } else if (signal.type === "ICE" && signal.payload) {
          if (peer?.remoteDescription) await peer.addIceCandidate(signal.payload as RTCIceCandidateInit)
          else pendingCandidates.push(signal.payload as RTCIceCandidateInit)
        }
      } catch (error) {
        console.warn("Proctor WebRTC negotiation failed:", error)
        setStatus("fallback")
      }
    }

    let pusher: Pusher | null = null
    let channel: ReturnType<Pusher["subscribe"]> | null = null
    let poller: number | null = null
    if (key && cluster) {
      pusher = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" })
      channel = pusher.subscribe(channelName)
      channel.bind("pusher:subscription_succeeded", () => void send("REQUEST", null))
      channel.bind("webrtc-signal", (signal: Signal) => void handleSignal(signal))
    } else {
      const poll = async () => {
        try {
          const response = await fetch(`/api/proctor/webrtc-signal?sessionId=${encodeURIComponent(sessionId)}&clientId=${encodeURIComponent(viewerId)}&since=${encodeURIComponent(since)}`, { cache: "no-store" })
          if (!response.ok || stopped) return
          const result = await response.json() as { signals?: Signal[] }
          for (const signal of result.signals ?? []) {
            if (signal.id && seenSignals.has(signal.id)) continue
            if (signal.id) seenSignals.add(signal.id)
            if (signal.createdAt && signal.createdAt > since) since = signal.createdAt
            await handleSignal(signal)
          }
        } catch {
          // A later poll can recover from a brief network interruption.
        }
      }
      void send("REQUEST", null)
      requestTimer = window.setInterval(() => void send("REQUEST", null), 4_000)
      void poll()
      poller = window.setInterval(() => void poll(), 750)
    }

    const fallbackTimer = window.setTimeout(() => setStatus((value) => value === "connecting" ? "fallback" : value), 8000)
    return () => {
      stopped = true
      window.clearTimeout(fallbackTimer)
      if (poller !== null) window.clearInterval(poller)
      if (requestTimer !== null) window.clearInterval(requestTimer)
      if (learnerId) void send("CLOSE", learnerId)
      peer?.close()
      channel?.unbind_all()
      pusher?.unsubscribe(channelName)
      pusher?.disconnect()
    }
  }, [sessionId])

  useEffect(() => {
    if (videoRef.current && liveStream) {
      videoRef.current.srcObject = liveStream
      void videoRef.current.play().catch(() => undefined)
    }
  }, [liveStream])

  const label = status === "live" ? (compact ? "LIVE" : "REAL-TIME VIDEO") : stale ? (compact ? "STALE" : "FEED STALE · LAST FRAME") : (compact ? "SNAPSHOT" : "SNAPSHOT FALLBACK")
  const objectFitClass = fit === "cover" ? "object-cover" : "object-contain"

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video bg-black flex items-center justify-center overflow-hidden group/proctor-feed ${className}`}
    >
      {status === "live" ? (
        <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full ${objectFitClass}`} />
      ) : fallbackSnapshot ? (
        <img src={fallbackSnapshot} alt={`Camera for ${candidateName}`} className={`h-full w-full ${objectFitClass}`} />
      ) : (
        <div className="text-center text-slate-500 space-y-2">
          <Camera className={compact ? "h-6 w-6 mx-auto opacity-40" : "h-12 w-12 mx-auto"} />
          {!compact && <p className="text-sm">Waiting for learner camera feed…</p>}
        </div>
      )}

      {/* Face guide target box - only shown in full view */}
      {!compact && (
        <div className="absolute inset-[15%_27%] border border-emerald-300/60 rounded-[2rem] pointer-events-none shadow-[0_0_24px_rgba(52,211,153,0.15)]" />
      )}

      {/* Status Badge */}
      <div className={`absolute ${compact ? "top-2.5 left-2.5 px-2 py-0.5 text-[9px]" : "top-4 left-4 px-3 py-1.5 text-[10px]"} rounded-full bg-black/70 backdrop-blur font-bold text-white flex items-center gap-1.5 shadow-sm`}>
        <span className={`${compact ? "h-1.5 w-1.5" : "h-2 w-2"} rounded-full ${status === "live" ? "bg-emerald-400 animate-pulse" : stale ? "bg-amber-400" : "bg-slate-400"}`} />
        {label}
      </div>

      {/* Fullscreen Maximize Toggle */}
      {showFullscreenButton && (
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
          className={`absolute ${compact ? "top-2.5 right-2.5 p-1 text-white/80 hover:text-white bg-black/60 hover:bg-black/80" : "top-4 right-4 p-1.5 text-white/80 hover:text-white bg-black/60 hover:bg-black/80"} rounded-lg backdrop-blur transition opacity-0 group-hover/proctor-feed:opacity-100 z-10`}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}
