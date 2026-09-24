"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const SESSION_KEY = "cpace-opening-seen"
const EXIT_DURATION_MS = 500
const PLAYBACK_RATE = 1.25

function rememberOpening() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "true")
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}

export function OpeningAnimation() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closing = useRef(false)
  const previousOverflow = useRef("")

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true

    rememberOpening()

    setLeaving(true)
    exitTimer.current = setTimeout(() => {
      document.body.style.overflow = previousOverflow.current
      setVisible(false)
    }, EXIT_DURATION_MS)
  }, [])

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "true") {
        setVisible(false)
        return
      }
    } catch {
      // The intro can still play without session storage.
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rememberOpening()
      closing.current = true
      setVisible(false)
      return
    }

    previousOverflow.current = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow.current
      if (exitTimer.current) clearTimeout(exitTimer.current)
    }
  }, [close])

  if (!visible) return null

  return (
    <section
      aria-label="CPACE opening animation"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity duration-500 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <video
        className="h-full w-full object-contain"
        src="/videos/cpace-opening.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => {
          event.currentTarget.playbackRate = PLAYBACK_RATE
        }}
        onEnded={close}
        onError={close}
        aria-label="CPACE Philippines introduction"
      />
      <button
        type="button"
        onClick={close}
        className="absolute right-5 top-5 rounded-full border border-white/40 bg-black/50 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:border-white/70 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-8 sm:top-8"
      >
        Skip intro
      </button>
    </section>
  )
}
