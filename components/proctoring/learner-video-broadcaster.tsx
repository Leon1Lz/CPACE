"use client"

import { useEffect } from "react"
import Pusher from "pusher-js"

type Signal = {
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
    if (!sessionId || !stream || !key || !cluster) return

    const clientId = crypto.randomUUID()
    const peers = new Map<string, RTCPeerConnection>()
    const pusher = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" })
    const channel = pusher.subscribe(`private-exam-session-${sessionId}`)
    const send = (type: Signal["type"], targetId: string, payload: Signal["payload"] = null) =>
      fetch("/api/proctor/webrtc-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, senderId: clientId, targetId, type, payload }),
      }).catch(() => undefined)

    const createPeer = (viewerId: string) => {
      peers.get(viewerId)?.close()
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

    channel.bind("webrtc-signal", async (signal: Signal) => {
      if (signal.senderRole !== "PROCTOR" || (signal.targetId && signal.targetId !== clientId)) return
      try {
        if (signal.type === "REQUEST") {
          const peer = createPeer(signal.senderId)
          await peer.setLocalDescription(await peer.createOffer())
          await send("OFFER", signal.senderId, peer.localDescription?.toJSON() ?? null)
        } else if (signal.type === "ANSWER" && signal.payload) {
          await peers.get(signal.senderId)?.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
        } else if (signal.type === "ICE" && signal.payload) {
          await peers.get(signal.senderId)?.addIceCandidate(signal.payload as RTCIceCandidateInit)
        } else if (signal.type === "CLOSE") {
          peers.get(signal.senderId)?.close()
          peers.delete(signal.senderId)
        }
      } catch (error) {
        console.warn("Learner WebRTC negotiation failed:", error)
      }
    })

    return () => {
      peers.forEach((peer) => peer.close())
      channel.unbind("webrtc-signal")
      pusher.unsubscribe(`private-exam-session-${sessionId}`)
      pusher.disconnect()
    }
  }, [sessionId, stream])

  return null
}
