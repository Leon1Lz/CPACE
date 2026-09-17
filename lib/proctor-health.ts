type HealthSession = {
  status: string
  lastHeartbeatAt?: string | null
  cameraStatus?: string | null
  detectorStatus?: string | null
  assessment?: { motionDetectionEnabled?: boolean }
}

export function getProctorHealth(session: HealthSession, snapshotAt: string | null | undefined, now: number) {
  if (session.status !== "IN_PROGRESS") return { connection: "ENDED", camera: "Ended", detector: "Ended", needsAttention: false }
  const age = (timestamp: string | null | undefined) => {
    if (!timestamp) return Infinity
    const parsed = Date.parse(timestamp)
    return Number.isFinite(parsed) ? Math.max(0, now - parsed) : Infinity
  }
  const heartbeatAge = age(session.lastHeartbeatAt)
  const connection = !session.lastHeartbeatAt ? "CONNECTING" : heartbeatAge > 30000 ? "DISCONNECTED" : heartbeatAge > 10000 ? "DELAYED" : "LIVE"
  const camera = session.cameraStatus === "ERROR" || session.cameraStatus === "DISCONNECTED" ? "Camera unavailable"
    : age(snapshotAt) <= 10000 && connection === "LIVE" && session.cameraStatus === "CONNECTED" ? "Live camera"
      : snapshotAt ? "Feed stale" : "Awaiting frame"
  const detector = session.assessment?.motionDetectionEnabled === false ? "Disabled by settings"
    : connection === "DISCONNECTED" ? "Detector offline"
      : session.detectorStatus === "ACTIVE" ? "Active" : session.detectorStatus || "Waiting"
  return { connection, camera, detector, needsAttention: connection !== "LIVE" || camera !== "Live camera" || (detector !== "Active" && detector !== "Disabled by settings") }
}
