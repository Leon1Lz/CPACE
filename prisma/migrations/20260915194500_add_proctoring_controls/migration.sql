-- AlterTable
ALTER TABLE "assessments"
ADD COLUMN "motionDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "detectFaceAbsence" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "detectMultipleFaces" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "detectGaze" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "detectPosture" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "detectionHoldMs" INTEGER NOT NULL DEFAULT 2500,
ADD COLUMN "detectionCooldownMs" INTEGER NOT NULL DEFAULT 12000,
ADD COLUMN "evidenceCaptureEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "evidenceRetentionDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "requireProctoringConsent" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "exam_sessions"
ADD COLUMN "consentAt" TIMESTAMP(3),
ADD COLUMN "consentVersion" TEXT,
ADD COLUMN "lastHeartbeatAt" TIMESTAMP(3),
ADD COLUMN "cameraStatus" TEXT,
ADD COLUMN "detectorStatus" TEXT;
