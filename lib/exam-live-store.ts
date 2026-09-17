export type LiveMotionEvent = {
  id: string
  reason: string
  occurredAt: string
}

type LiveExamState = {
  snapshot: string | null
  snapshotAt: string | null
  events: LiveMotionEvent[]
}

declare global {
  var __cpaceExamLiveStore: Map<string, LiveExamState> | undefined
}

const liveStore = globalThis.__cpaceExamLiveStore ?? new Map<string, LiveExamState>()
globalThis.__cpaceExamLiveStore = liveStore
const LIVE_SNAPSHOT_TTL_MS = 30_000

function stateFor(sessionId: string): LiveExamState {
  const current = liveStore.get(sessionId)
  if (current) return current
  const created = { snapshot: null, snapshotAt: null, events: [] }
  liveStore.set(sessionId, created)
  return created
}

export function setLiveSnapshot(sessionId: string, snapshot: string) {
  const state = stateFor(sessionId)
  state.snapshot = snapshot
  state.snapshotAt = new Date().toISOString()
}

export function addLiveMotionEvent(sessionId: string, reason: string) {
  const state = stateFor(sessionId)
  state.events.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reason,
    occurredAt: new Date().toISOString(),
  })
  state.events = state.events.slice(0, 50)
}

export function getLiveExamState(sessionId: string): LiveExamState {
  const state = liveStore.get(sessionId)
  if (!state) return { snapshot: null, snapshotAt: null, events: [] }
  if (state.snapshotAt && Date.now() - new Date(state.snapshotAt).getTime() > LIVE_SNAPSHOT_TTL_MS) {
    state.snapshot = null
    state.snapshotAt = null
  }
  return state
}

export function clearLiveExamState(sessionId: string) {
  liveStore.delete(sessionId)
}

export function getAllLiveSnapshots() {
  return Object.fromEntries(
    Array.from(liveStore.keys()).map((sessionId) => [
      sessionId,
      (() => {
        const state = getLiveExamState(sessionId)
        return { snapshot: state.snapshot, snapshotAt: state.snapshotAt }
      })(),
    ]),
  )
}
