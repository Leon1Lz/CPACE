ALTER TABLE "answers" ADD COLUMN "feedback" TEXT;
ALTER TABLE "assessment_results" ADD COLUMN "gradedAt" TIMESTAMP(3), ADD COLUMN "gradedById" TEXT;
UPDATE "assessment_results" AS r SET "gradedAt" = r."completedAt"
WHERE r."completedAt" IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM "questions" q WHERE q."assessmentId" = r."assessmentId" AND q."type" IN ('SHORT_ANSWER', 'ESSAY')
);
CREATE INDEX "assessment_results_gradedAt_idx" ON "assessment_results"("gradedAt");
