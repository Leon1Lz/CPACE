"use client"

import { useEffect } from "react"
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

export function LearnerVideoBroadcaster({ sessionId, stream }: { sessionId: string | null; stream: MediaStream | null }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!sessionId || !stream) return

    const clientId = crypto.randomUUID()
    const peers = new Map<string, RTCPeerConnection>()
    const pendingCandidates = new Map<string, RTCIceCandidateInit[]>()
    const channelName = `private-exam-session-${sessionId}`
    const seenSignals = new Set<string>()
    let since = new Date(Date.now() - 5_000).toISOString()
    let stopped = false
    const send = (type: Signal["type"], targetId: string, payload: Signal["payload"] = null) =>
      fetch("/api/proctor/webrtc-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, senderId: clientId, targetId, type, payload }),
      }).catch(() => undefined)

    const createPeer = (viewerId: string) => {
      peers.get(viewerId)?.close()
      pendingCandidates.set(viewerId, [])
      const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] })
      stream.getTracks().forEach((track) => peer.addTrack(track, stream))
      peer.onicecandidate = (event) => {
        if (event.candidate) void send("ICE", viewerId, event.candidate.toJSON())
      }
      peer.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
          peer.close()
          peers.delete(viewerId)
        }
      }
      peers.set(viewerId, peer)
      return peer
    }

    const handleSignal = async (signal: Signal) => {
      if (signal.senderRole !== "PROCTOR" || (signal.targetId && signal.targetId !== clientId)) return
      try {
        if (signal.type === "REQUEST") {
          const peer = createPeer(signal.senderId)
          await peer.setLocalDescription(await peer.createOffer())
          await send("OFFER", signal.senderId, peer.localDescription?.toJSON() ?? null)
        } else if (signal.type === "ANSWER" && signal.payload) {
          const peer = peers.get(signal.senderId)
          if (peer) {
            await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
            for (const candidate of pendingCandidates.get(signal.senderId) ?? []) await peer.addIceCandidate(candidate)
            pendingCandidates.set(signal.senderId, [])
          }
        } else if (signal.type === "ICE" && signal.payload) {
          const peer = peers.get(signal.senderId)
          if (peer?.remoteDescription) await peer.addIceCandidate(signal.payload as RTCIceCandidateInit)
          else pendingCandidates.set(signal.senderId, [...(pendingCandidates.get(signal.senderId) ?? []), signal.payload as RTCIceCandidateInit])
        } else if (signal.type === "CLOSE") {
          peers.get(signal.senderId)?.close()
          peers.delete(signal.senderId)
        }
      } catch (error) {
        console.warn("Learner WebRTC negotiation failed:", error)
      }
    }

    let pusher: Pusher | null = null
    let channel: ReturnType<Pusher["subscribe"]> | null = null
    let poller: number | null = null
    if (key && cluster) {
      pusher = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" })
      channel = pusher.subscribe(channelName)
      channel.bind("webrtc-signal", (signal: Signal) => void handleSignal(signal))
    } else {
      const poll = async () => {
        try {
          const response = await fetch(`/api/proctor/webrtc-signal?sessionId=${encodeURIComponent(sessionId)}&clientId=${encodeURIComponent(clientId)}&since=${encodeURIComponent(since)}`, { cache: "no-store" })
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
      void poll()
      poller = window.setInterval(() => void poll(), 750)
    }

    return () => {
      stopped = true
      if (poller !== null) window.clearInterval(poller)
      peers.forEach((peer) => peer.close())
      channel?.unbind("webrtc-signal")
      pusher?.unsubscribe(channelName)
      pusher?.disconnect()
    }
  }, [sessionId, stream])

  return null
}
