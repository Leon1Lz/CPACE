ALTER TABLE "exam_sessions" ADD COLUMN "deadlineAt" TIMESTAMP(3);
ALTER TABLE "assessments" ADD COLUMN "bankLockedAt" TIMESTAMP(3), ADD COLUMN "questionVersion" INTEGER NOT NULL DEFAULT 0;
UPDATE "exam_sessions" AS s SET "deadlineAt" = s."startedAt" + a."timeLimit" * INTERVAL '1 minute'
FROM "assessments" AS a WHERE s."assessmentId" = a."id" AND a."timeLimit" IS NOT NULL;
UPDATE "assessments" AS a SET "bankLockedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "exam_sessions" s WHERE s."assessmentId" = a."id")
OR EXISTS (SELECT 1 FROM "assessment_results" r WHERE r."assessmentId" = a."id");
