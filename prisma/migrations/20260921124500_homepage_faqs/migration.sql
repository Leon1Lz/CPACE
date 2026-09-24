CREATE TABLE "homepage_faqs" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "homepage_faqs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "homepage_faqs_isPublished_sortOrder_idx" ON "homepage_faqs"("isPublished", "sortOrder");

INSERT INTO "homepage_faqs" ("id", "category", "question", "answer", "isPublished", "sortOrder") VALUES
('faq-1', 'certifications', 'What certifications does CPACE Philippines offer?', 'CPACE Philippines provides industry-recognized certifications including the Certified Financial Management Specialist (CFMS®), Certified Marketing Management Specialist (CMMS®), Certified Operations Management Specialist (COMS®), and the Certified Human Resource Associate (CHRA™) review lecture and credential programs.', true, 0),
('faq-2', 'certifications', 'Are CPACE certifications recognized by employers and institutions?', 'Yes. CPACE certifications are recognized by leading employers, corporate institutions, and over 20+ top academic universities across the Philippines as validated benchmarks of professional competence.', true, 1),
('faq-3', 'certifications', 'How are the training programs and examinations conducted?', 'Programs are delivered through flexible hybrid learning pathways. Training modules and webinars are available through the Learning Portal, while examinations are administered online with secure proctoring or in person at partner testing centers.', true, 2),
('faq-4', 'partnerships', 'How can our school or company partner with CPACE?', 'We welcome academic institutions, media organizations, and corporate partners. Contact our Corporate & Institutional Services team through the contact form or at corporate@cpaceph.com.', true, 3),
('faq-5', 'verification', 'How can employers and graduates verify certification credentials?', 'Official credential authenticity can be verified through Student Support & Verification at support@cpaceph.com or +63 956 221-2400 using the certified individual''s name and certificate reference.', true, 4),
('faq-6', 'certifications', 'How do I register for an upcoming certification or short course?', 'Enroll through linktr.ee/cpaceph or submit an inquiry through the contact form to receive syllabus guides, schedules, and fee details.', true, 5);
