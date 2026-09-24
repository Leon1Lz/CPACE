"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function cameraErrorMessage(error: unknown): string {
  const name = error && typeof error === "object" && "name" in error ? error.name : ""
  switch (name) {
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera found. Connect or enable a webcam, then select Enable Webcam to retry."
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Camera access is blocked. Allow camera access in your browser and device privacy settings, then retry."
    case "NotReadableError":
    case "TrackStartError":
      return "Your camera could not be opened. Close other apps using it, check the device, then retry."
    case "OverconstrainedError":
      return "Your camera does not support the requested settings. Try another camera or browser."
    case "NotSupportedError":
      return "Camera access is unavailable. Open this page over HTTPS or localhost in a browser that supports webcams."
    default:
      return "The camera could not be started. Check your webcam and browser permissions, then retry."
  }
}

/** Own one camera stream and release requests that finish after stop/unmount. */
export function useAssessmentCamera() {
  const streamRef = useRef<MediaStream | null>(null)
  const requestRef = useRef<Promise<boolean> | null>(null)
  const generationRef = useRef(0)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraStarting, setCameraStarting] = useState(false)

  const releaseStream = useCallback(() => {
    generationRef.current++
    requestRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  const stopCamera = useCallback(() => {
    releaseStream()
    setCameraActive(false)
    setCameraStarting(false)
  }, [releaseStream])

  const startCamera = useCallback((): Promise<boolean> => {
    if (requestRef.current) return requestRef.current
    if (streamRef.current?.getVideoTracks().some(track => track.readyState === "live")) {
      return Promise.resolve(true)
    }
    releaseStream()
    const generation = generationRef.current
    setCameraActive(false)
    setCameraError(null)
    setCameraStarting(true)

    // Defer the request so the shared promise is assigned even if the API is absent.
    const pending = Promise.resolve().then(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new DOMException("Camera API unavailable", "NotSupportedError")
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
          audio: false,
        })
        if (generation !== generationRef.current) {
          stream.getTracks().forEach(track => track.stop())
          return false
        }
        streamRef.current = stream
        setCameraActive(true)
        return true
      } catch (error) {
        if (generation === generationRef.current) {
          setCameraError(cameraErrorMessage(error))
          setCameraActive(false)
        }
        return false
      } finally {
        if (generation === generationRef.current) {
          requestRef.current = null
          setCameraStarting(false)
        }
      }
    })
    requestRef.current = pending
    return pending
  }, [releaseStream])

  useEffect(() => releaseStream, [releaseStream])

  return { stream: cameraActive ? streamRef.current : null, streamRef, cameraActive, cameraError, cameraStarting, startCamera, stopCamera }
}
