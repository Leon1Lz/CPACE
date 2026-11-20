CREATE TABLE "rate_limit_buckets" (
    "keyHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("keyHash")
);

CREATE INDEX "rate_limit_buckets_resetAt_idx"
ON "rate_limit_buckets"("resetAt");
