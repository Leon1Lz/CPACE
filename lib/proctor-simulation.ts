const candidates = [
  ["Jordan", "Lee", "photo-1494790108377-be9c29b29330"],
  ["Miguel", "Santos", "photo-1500648767791-00dcc994a43e"],
  ["Angela", "Reyes", "photo-1534528741775-53994a69daeb"],
  ["Carlo", "Mendoza", "photo-1507003211169-0a1dd7228f2d"],
  ["Bianca", "Cruz", "photo-1438761681033-6461ffad8d80"],
  ["Paolo", "Garcia", "photo-1506794778202-cad84cf45f1d"],
  ["Sofia", "Ramos", "photo-1544005313-94ddf0286df2"],
  ["Nathan", "Flores", "photo-1507591064344-4c6ce005b128"],
  ["Camille", "Torres", "photo-1547425260-76bcadfb4f2c"],
  ["Andre", "Villanueva", "photo-1531384441138-2736e62e0919"],
  ["Patricia", "Lim", "photo-1524504388940-b1c1722653e1"],
  ["Marco", "Navarro", "photo-1501196354995-cbb51c65aaea"],
] as const

const violations = [
  null,
  "[WARNING] LOOKING_LEFT: Candidate looked away from the exam screen (3.2s)",
  "[HIGH] MULTIPLE_FACES: More than one face was visible in the camera (4.8s)",
  null,
  "[WARNING] POSTURE_CHANGE: Major posture movement was detected (3.6s)",
  "[HIGH] NO_FACE: Candidate left the camera frame (6.1s)",
  null,
  "[WARNING] LOOKING_DOWN: Candidate looked below the exam screen (2.9s)",
  null,
  "[HIGH] MULTIPLE_FACES: Another person entered the camera frame (5.4s)",
  "[WARNING] LOOKING_RIGHT: Candidate repeatedly looked away (3.1s)",
  null,
] as const

const programs = [
  { code: "CFMS", exam: "CFMS Final Examination", course: "Certificate in Financial Management Services" },
  { code: "CMMS", exam: "CMMS Final Examination", course: "Certificate in Marketing Management Services" },
  { code: "COMS", exam: "COMS Final Examination", course: "Certificate in Operations Management Services" },
] as const

function candidatePhoto(photoId: string) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=82`
}

export function buildSimulatedSessions(now = Date.now(), count = 12) {
  const size = Math.min(250, Math.max(1, Math.floor(Number.isFinite(count) ? count : 12)))
  return Array.from({ length: size }, (_, index) => {
    const [firstName, lastName, photoId] = candidates[index % candidates.length]
    const program = programs[index % programs.length]
    const status = index % 12 === 10 ? "SUBMITTED" : index % 12 === 11 ? "ABANDONED" : "IN_PROGRESS"
    const reason = violations[index % violations.length]
    const startedAt = new Date(now - (index + 3) * 94_000).toISOString()
    return {
      id: `simulation-${index + 1}`,
      status,
      startedAt,
      submittedAt: status === "SUBMITTED" ? new Date(now - 45_000).toISOString() : null,
      flagged: Boolean(reason),
      flagReason: reason,
      ipAddress: `192.168.10.${40 + index}`,
      identityPhoto: candidatePhoto(photoId),
      idPhoto: null,
      lastHeartbeatAt: new Date(now - (index % 9 === 8 ? 45000 : index % 9 === 7 ? 15000 : 1000)).toISOString(),
      cameraStatus: index % 9 === 8 ? "DISCONNECTED" : "CONNECTED",
      detectorStatus: index % 9 === 8 ? "ERROR" : "ACTIVE",
      user: {
        id: `sim-user-${index + 1}`,
        firstName,
        lastName,
        email: `${firstName}.${lastName}.${index + 1}@simulation.cpace`.toLowerCase(),
      },
      assessment: {
        id: `simulation-${program.code.toLowerCase()}-final-exam`,
        title: `${program.exam} — Simulation`,
        type: "FINAL_EXAM",
        motionDetectionEnabled: true,
        course: { title: program.course },
      },
    }
  })
}

export function buildSimulatedMonitor(sessionId: string, now = Date.now()) {
  if (!/^simulation-\d+$/.test(sessionId)) return null
  const number = Number(sessionId.replace("simulation-", ""))
  if (number < 1 || number > 250) return null
  const session = buildSimulatedSessions(now, Math.max(12, number)).find((item) => item.id === sessionId)
  if (!session) return null
  const index = Number(sessionId.replace("simulation-", "")) - 1
  const baseReason = violations[index % violations.length]
  const eventReasons = baseReason
    ? [
        baseReason,
        ...(baseReason.includes("MULTIPLE_FACES") ? ["[WARNING] LOOKING_RIGHT: Candidate attention moved away from the screen (2.8s)"] : []),
        ...(baseReason.includes("NO_FACE") ? ["[WARNING] POSTURE_CHANGE: Candidate moved outside the expected position (3.4s)"] : []),
      ]
    : []

  return {
    session,
    liveSnapshot: session.identityPhoto,
    snapshotAt: session.lastHeartbeatAt,
    events: eventReasons.map((reason, eventIndex) => ({
      id: `${sessionId}-event-${eventIndex}`,
      reason,
      occurredAt: new Date(now - (eventIndex + 1) * 38_000).toISOString(),
    })),
  }
}
