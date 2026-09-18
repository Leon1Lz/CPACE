export const MAX_LIVE_SNAPSHOT_BYTES = 512 * 1024

/** Only capture actual video frames, never an empty or warming-up canvas. */
export function captureLiveSnapshot(video: HTMLVideoElement | null, stream: MediaStream | null): string | null {
  if (!stream?.getVideoTracks().some(track => track.readyState === "live")
    || !video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null
  const canvas = document.createElement("canvas")
  canvas.width = 160
  canvas.height = 120
  const context = canvas.getContext("2d")
  if (!context) return null
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const snapshot = canvas.toDataURL("image/jpeg", 0.6)
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(snapshot)
  if (!match) return null
  const padding = match[1].endsWith("==") ? 2 : match[1].endsWith("=") ? 1 : 0
  const bytes = Math.floor(match[1].length * 3 / 4) - padding
  return bytes >= 64 && bytes <= MAX_LIVE_SNAPSHOT_BYTES ? snapshot : null
}
