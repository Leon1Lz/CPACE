-- CreateTable
CREATE TABLE "article_comments" (
    "id" TEXT NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_comments_articleSlug_isVisible_createdAt_idx" ON "article_comments"("articleSlug", "isVisible", "createdAt");
