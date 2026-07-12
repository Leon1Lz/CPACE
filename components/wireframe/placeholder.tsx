"use client"

import { cn } from "@/lib/utils"

interface PlaceholderBoxProps {
  className?: string
  label?: string
  aspectRatio?: "square" | "video" | "wide" | "portrait"
}

export function PlaceholderBox({ className, label, aspectRatio = "square" }: PlaceholderBoxProps) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[3/1]",
    portrait: "aspect-[3/4]",
  }

  return (
    <div
      className={cn(
        "bg-muted border-2 border-dashed border-border rounded-md flex items-center justify-center",
        aspectClasses[aspectRatio],
        className
      )}
    >
      {label && (
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
      )}
    </div>
  )
}

interface PlaceholderTextProps {
  lines?: number
  className?: string
}

export function PlaceholderText({ lines = 3, className }: PlaceholderTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 bg-muted rounded",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

interface PlaceholderAvatarProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PlaceholderAvatar({ size = "md", className }: PlaceholderAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  return (
    <div
      className={cn(
        "rounded-full bg-muted border border-border flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      <svg
        className="h-1/2 w-1/2 text-muted-foreground"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  )
}

interface PlaceholderChartProps {
  type?: "bar" | "line" | "pie" | "donut"
  className?: string
}

export function PlaceholderChart({ type = "bar", className }: PlaceholderChartProps) {
  return (
    <div
      className={cn(
        "bg-muted/50 border border-dashed border-border rounded-md p-4 flex items-end justify-center gap-2 min-h-[150px]",
        className
      )}
    >
      {type === "bar" && (
        <>
          <div className="w-8 h-16 bg-chart-1 rounded-t" />
          <div className="w-8 h-24 bg-chart-2 rounded-t" />
          <div className="w-8 h-12 bg-chart-3 rounded-t" />
          <div className="w-8 h-20 bg-chart-4 rounded-t" />
          <div className="w-8 h-14 bg-chart-5 rounded-t" />
        </>
      )}
      {type === "line" && (
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-chart-1"
            points="0,80 40,60 80,70 120,30 160,50 200,20"
          />
        </svg>
      )}
      {(type === "pie" || type === "donut") && (
        <div className="relative">
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              strokeDasharray="75 25"
              className="text-chart-1"
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              strokeDasharray="25 75"
              strokeDashoffset="-75"
              className="text-chart-2"
              transform="rotate(-90 50 50)"
            />
            {type === "donut" && (
              <circle cx="50" cy="50" r="25" className="fill-background" />
            )}
          </svg>
        </div>
      )}
    </div>
  )
}

interface WireframeLabelProps {
  children: React.ReactNode
  className?: string
}

export function WireframeLabel({ children, className }: WireframeLabelProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-primary text-primary-foreground rounded",
        className
      )}
    >
      {children}
    </div>
  )
}

interface PlaceholderImageProps {
  className?: string
  label?: string
}

export function PlaceholderImage({ className, label = "Image" }: PlaceholderImageProps) {
  return (
    <div
      className={cn(
        "bg-muted border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-2 min-h-[200px]",
        className
      )}
    >
      <svg
        className="h-12 w-12 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <polyline points="21 15 16 10 5 21" strokeWidth="2" />
      </svg>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
    </div>
  )
}

interface PlaceholderLogoProps {
  className?: string
  text?: string
  size?: "sm" | "md" | "lg"
}

export function PlaceholderLogo({ className, text = "LOGO", size = "md" }: PlaceholderLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-10 w-10"
  }

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 font-bold text-foreground",
        className
      )}
    >
      <div className={cn("bg-muted border border-border rounded flex items-center justify-center", sizeClasses[size])}>
        <svg
          className={cn("text-muted-foreground", iconSizeClasses[size])}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className={textSizeClasses[size]}>{text}</span>
    </div>
  )
}
