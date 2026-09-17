export type ParsedProctoringEvent = {
  type: string
  severity: "WARNING" | "HIGH"
  description: string
  duration: number | null
}

export function parseProctoringReason(reason?: string | null): ParsedProctoringEvent {
  const fallback = reason?.trim() || "Security violation"
  const match = fallback.match(/^\[([^\]]+)\]\s+([^:]+):\s*(.*?)(?:\s+\(([\d.]+)s\))?$/)
  if (!match) {
    return {
      type: "SECURITY_VIOLATION",
      severity: "WARNING",
      description: fallback,
      duration: null,
    }
  }

  return {
    type: match[2].trim().toUpperCase().replaceAll(" ", "_"),
    severity: match[1].trim().toUpperCase() === "HIGH" ? "HIGH" : "WARNING",
    description: match[3].trim(),
    duration: match[4] ? Number(match[4]) : null,
  }
}

export function formatProctoringReason(event: ParsedProctoringEvent) {
  const duration = event.duration === null ? "" : ` (${event.duration}s)`
  return `[${event.severity}] ${event.type}: ${event.description}${duration}`
}
