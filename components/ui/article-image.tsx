"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

const FALLBACK_IMAGE = "/assets/hero-bg.jpg"

type ArticleImageProps = {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
}

export function ArticleImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: ArticleImageProps) {
  const requestedSource = src || FALLBACK_IMAGE
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const imageSource = failedSource === requestedSource ? FALLBACK_IMAGE : requestedSource

  return (
    <Image
      src={imageSource}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => setFailedSource(requestedSource)}
    />
  )
}
