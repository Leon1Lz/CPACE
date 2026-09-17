ALTER TABLE "exam_sessions" ADD COLUMN "identityVerifiedAt" TIMESTAMP(3);
UPDATE "exam_sessions" SET "identityVerifiedAt" = "startedAt"
WHERE "identityPhoto" IS NOT NULL AND "idPhoto" IS NOT NULL;
