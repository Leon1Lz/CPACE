"use client"

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react"
import { Camera } from "lucide-react"
import Pusher from "pusher-js"

type Signal = {
  senderId: string
  targetId: string | null
  senderRole: "LEARNER" | "PROCTOR"
  type: "REQUEST" | "OFFER" | "ANSWER" | "ICE" | "CLOSE"
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null
}

export function ProctorVideoFeed({ sessionId, fallbackSnapshot, candidateName, stale }: { sessionId: string; fallbackSnapshot: string | null; candidateName: string; stale: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null)
  const realtimeConfigured = Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER) && !sessionId.startsWith("simulation-")
  const [status, setStatus] = useState<"connecting" | "live" | "fallback">(() => realtimeConfigured ? "connecting" : "fallback")

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster || sessionId.startsWith("simulation-")) return

    const viewerId = crypto.randomUUID()
    let learnerId = ""
    let peer: RTCPeerConnection | null = null
    const pendingCandidates: RTCIceCandidateInit[] = []
    const pusher = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" })
    const channelName = `private-exam-session-${sessionId}`
    const channel = pusher.subscribe(channelName)
    const send = (type: Signal["type"], targetId: string | null, payload: Signal["payload"] = null) =>
      fetch("/api/proctor/webrtc-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, senderId: viewerId, targetId, type, payload }),
      }).catch(() => undefined)

    channel.bind("pusher:subscription_succeeded", () => void send("REQUEST", null))
    channel.bind("webrtc-signal", async (signal: Signal) => {
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
    })

    const fallbackTimer = window.setTimeout(() => setStatus((value) => value === "connecting" ? "fallback" : value), 8000)
    return () => {
      window.clearTimeout(fallbackTimer)
      if (learnerId) void send("CLOSE", learnerId)
      peer?.close()
      channel.unbind_all()
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [sessionId])

  useEffect(() => {
    if (videoRef.current && liveStream) {
      videoRef.current.srcObject = liveStream
      void videoRef.current.play().catch(() => undefined)
    }
  }, [liveStream])

  const label = status === "live" ? "REAL-TIME VIDEO" : stale ? "FEED STALE · LAST FRAME" : "SNAPSHOT FALLBACK"
  return (
    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
      {status === "live" ? (
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
      ) : fallbackSnapshot ? (
        <img src={fallbackSnapshot} alt={`Camera for ${candidateName}`} className="h-full w-full object-contain" />
      ) : (
        <div className="text-center text-slate-500 space-y-3"><Camera className="h-12 w-12 mx-auto" /><p className="text-sm">Waiting for learner camera feed…</p></div>
      )}
      <div className="absolute inset-[15%_27%] border border-emerald-300/60 rounded-[2rem] pointer-events-none shadow-[0_0_24px_rgba(52,211,153,0.15)]" />
      <div className="absolute top-4 left-4 rounded-full bg-black/60 backdrop-blur px-3 py-1.5 text-[10px] font-bold text-white flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-emerald-400 animate-pulse" : stale ? "bg-amber-400" : "bg-slate-400"}`} />
        {label}
      </div>
    </div>
  )
}
