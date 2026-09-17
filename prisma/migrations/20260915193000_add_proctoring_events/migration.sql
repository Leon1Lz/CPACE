-- CreateEnum
CREATE TYPE "ProctoringEventSeverity" AS ENUM ('WARNING', 'HIGH');

-- CreateEnum
CREATE TYPE "ProctoringEventReviewStatus" AS ENUM ('PENDING', 'REVIEWED', 'FALSE_POSITIVE', 'CONFIRMED', 'ESCALATED');

-- CreateTable
CREATE TABLE "proctoring_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "ProctoringEventSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "evidenceSnapshot" TEXT,
    "reviewStatus" "ProctoringEventReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "proctoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proctoring_events_sessionId_createdAt_idx" ON "proctoring_events"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "proctoring_events_reviewStatus_idx" ON "proctoring_events"("reviewStatus");

-- AddForeignKey
ALTER TABLE "proctoring_events" ADD CONSTRAINT "proctoring_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
