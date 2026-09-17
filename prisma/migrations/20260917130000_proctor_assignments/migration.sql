CREATE TABLE "proctor_assignments" (
  "id" TEXT NOT NULL,
  "proctorId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "groupId" TEXT,
  "scopeKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "proctor_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "proctor_assignments_proctorId_fkey" FOREIGN KEY ("proctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proctor_assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proctor_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "proctor_assignments_proctorId_courseId_scopeKey_key" ON "proctor_assignments"("proctorId", "courseId", "scopeKey");
CREATE INDEX "proctor_assignments_proctorId_idx" ON "proctor_assignments"("proctorId");
