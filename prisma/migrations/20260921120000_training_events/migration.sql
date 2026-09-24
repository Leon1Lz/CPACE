CREATE TABLE "training_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "certification" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "deliveryMode" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'from-emerald-500 to-teal-600',
    "spots" TEXT NOT NULL,
    "registrationUrl" TEXT NOT NULL DEFAULT 'https://linktr.ee/cpaceph',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "training_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "training_events_isPublished_sortOrder_idx" ON "training_events"("isPublished", "sortOrder");

INSERT INTO "training_events" ("id", "title", "certification", "startDate", "endDate", "time", "location", "deliveryMode", "color", "spots", "registrationUrl", "isPublished", "sortOrder") VALUES
('default-cfms-2026', 'CFMS® Certification Review & Examination', 'CFMS®', '2026-10-18', '2026-10-19', '9:00 AM – 5:00 PM (PHT)', 'Online via LMS + Proctored Exam', 'online', 'from-emerald-500 to-teal-600', 'Limited slots available', 'https://linktr.ee/cpaceph', true, 0),
('default-chra-2026', 'CHRA™ Review Lecture — Batch 47', 'CHRA™', '2026-11-08', '2026-11-09', '8:30 AM – 5:30 PM (PHT)', 'BGC Taguig City & Online Hybrid', 'hybrid', 'from-orange-500 to-amber-600', 'Filling up fast', 'https://linktr.ee/cpaceph', true, 1),
('default-cmms-2026', 'CMMS® Certification Review & Examination', 'CMMS®', '2026-11-22', '2026-11-23', '9:00 AM – 5:00 PM (PHT)', 'Online via LMS + Proctored Exam', 'online', 'from-blue-500 to-cyan-600', 'Open for registration', 'https://linktr.ee/cpaceph', true, 2),
('default-dpodps-2026', 'DPODPS — Data Privacy Officer Training', 'DPODPS', '2026-12-06', '2026-12-07', '9:00 AM – 4:00 PM (PHT)', 'BGC Taguig City (In-Person)', 'in-person', 'from-rose-500 to-pink-600', 'Early bird pricing available', 'https://linktr.ee/cpaceph', true, 3);
