export async function loadProctorSessionList<T>(fetcher: typeof fetch = fetch): Promise<T[]> {
  const sessions: T[] = []
  let cursor: string | null = null
  const seenCursors = new Set<string>()
  do {
    const params = new URLSearchParams({ pagination: "true" })
    if (cursor) params.set("cursor", cursor)
    const response = await fetcher(`/api/proctor/sessions?${params}`, { cache: "no-store" })
    if (!response.ok) throw new Error("Unable to load exam sessions. Please refresh or sign in again.")
    const page = await response.json() as { data: T[]; nextCursor: string | null }
    sessions.push(...page.data)
    cursor = page.nextCursor
    if (cursor) {
      if (seenCursors.has(cursor)) throw new Error("Session pagination could not advance. Please refresh.")
      seenCursors.add(cursor)
    }
  } while (cursor)
  return sessions
}
