-- CreateTable
CREATE TABLE "webrtc_signals" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "targetId" TEXT,
    "senderRole" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webrtc_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webrtc_signals_sessionId_createdAt_idx" ON "webrtc_signals"("sessionId", "createdAt");
