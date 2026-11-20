"use client"

import { useEffect, useRef, useState } from "react"

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({ end, duration = 2000, prefix = "", suffix = "", className }: CountUpProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reducedMotion.matches || duration <= 0 || !("IntersectionObserver" in window)) {
      setCount(end)
      return
    }

    let frameId = 0
    let started = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true
          observer.disconnect()
          let startTime: number | undefined

          const animate = (currentTime: number) => {
            startTime ??= currentTime
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * end))

            if (progress < 1) {
              frameId = requestAnimationFrame(animate)
            }
          }

          frameId = requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )

    const finish = () => {
      if (reducedMotion.matches) {
        observer.disconnect()
        cancelAnimationFrame(frameId)
        setCount(end)
      }
    }

    observer.observe(element)
    reducedMotion.addEventListener("change", finish)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
      reducedMotion.removeEventListener("change", finish)
    }
  }, [end, duration])

  const formattedCount = count.toLocaleString("en-US")

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{prefix}{end.toLocaleString("en-US")}{suffix}</span>
      <span aria-hidden="true">{prefix}{formattedCount}{suffix}</span>
    </span>
  )
}
