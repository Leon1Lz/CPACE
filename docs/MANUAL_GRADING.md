# Written-answer grading

Admins and instructors can open **Dashboard > Grading Queue** (`/dashboard/grading`). Instructors see only their own courses. The queue has awaiting-grading and finalized filters, 25-row pages, retry/refresh controls, and oldest-first submission order.

Open Review answers, assign points to every essay/short answer (explicit zero is allowed), add optional feedback up to 2,000 characters, and confirm Finalize grades. Automatic-choice points are preserved. Final score uses the full question-point denominator, and passing uses the assessment's locked passing threshold. Foreign/duplicate answers, missing marks, non-finite/negative/over-maximum points, unauthorized courses, and already-finalized reviews are denied.

Answer updates, final score/pass status, reviewer/timestamp, notification, and eligible final-exam certificate/enrollment updates commit together. Finalized grades are read-only in this first workflow; a future audited regrade workflow would be a separate feature. An uncertain retry cannot duplicate or revise a completed grade: reload the finalized queue to confirm it.

Learners see pending grading rather than provisional failure. After grading AND score release, My Progress shows the final score and instructor feedback. Held scores/feedback stay hidden. Reports include finalized manual grades in pass/average metrics and exclude pending reviews; CSVs show grading status rather than provisional score/pass values. Learning-path best scores mask held scores, while completion continues using finalized pass status under the existing prerequisite policy.

Passing released final exams issue a certificate and complete eligible enrollments at grading time. Passing held final exams follow the existing admin release workflow; explicitly enabling immediate release processes graded results. A future scheduled release can make scores visible by time, but automatic certificate/notification delivery at that future instant still needs a background release job.

Instructor pending counts now count all scoped submitted ungraded written-answer results, independent of the latest-five activity list. Learner attempt counts use only that learner's results.

Migration `20260917170000_manual_grading` adds answer feedback and result review metadata; existing completed auto-only results are backfilled as graded. Existing written-answer results remain pending. No records are deleted. Incomplete legacy answer histories are rejected rather than receiving misleading scores.

Verification: helper, authorization, held-score, finalized-grade, certificate, ownership, pagination, UI retry/preserved marks, report feedback, and instructor count regression tests passed. Real authenticated instructor/learner walkthroughs remain pending.
