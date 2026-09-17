# Exam integrity remediation

Outcome: fixed at the tested API boundaries. The security-fix workflow supplied an independent read-only investigation and one candidate bypass/regression review. These identified sessionless aliases, cleanup-related unlocking, concurrent settings changes, and identity-evidence retention as necessary compatibility cases.

## Boundaries and strategy

- Previously, browser countdown expiry did not prevent new answers reaching draft/submission writes. Client-provided start times could not serve as an authoritative deadline. Sessions now snapshot `deadlineAt` from server time and duration; timed exams require a session. Draft reads/checks/writes serialize on the owned session row. Expired submissions accept only that session's persisted draft, not request answers. Normal answers received before the deadline still work; submitted-result confirmation remains idempotent.
- Late recovery uses a server-maintained identity-verification timestamp so image retention does not invalidate an already-verified final exam. Identity and required consent remain mandatory; fresh heartbeat/camera readiness is waived only for expired saved-draft recovery. This timestamp records completion of the existing image/consent setup, not biometric proof of identity.
- Previously, only question editing checked some session/result states. Add/delete/import and ancestor deletions could modify or cascade away historical answers. All these paths now use assessment-row locks plus an irreversible `bankLockedAt` marker; cleanup cannot unlock the bank. Learner start shares the lock. A question version detects concurrent changes during an untimed sessionless first submission. The final commit rechecks current timing/schedule/publication settings.
- Used banks also lock type, duration, and passing score, preventing retroactive exam/grading changes. New unused assessments remain editable. Schedule and release controls remain available.

## Changed files

- Shared enforcement: `lib/assessment-integrity.ts`, `lib/assessment-timing.ts`.
- API callers: assessment start/draft/submit/settings/delete, question add/edit/delete/import, and course deletion routes.
- UI: assessment setup/countdown/recovery notice and question-deletion error handling.
- Schema/migrations: `20260917160000_exam_deadlines`, `20260917163000_exam_identity_verified`; existing timed deadlines and history locks are backfilled, no records removed.
- Regression artifacts: `tests/assessment-integrity-routes.test.ts`, `tests/assessment-timing-routes.test.ts`, updated existing assessment tests, and `scripts/check-assessment-integrity.ts`.

## Ordered verification

1. Type/import gate: `npm run type-check` passed. Targeted source/tests/scripts lint passed. Production build passed; the existing middleware-convention deprecation warning remains.
2. Trigger/alternate input gate: tests show late injected correct answers cannot replace a saved wrong answer; a forged client start time and timed sessionless submission are denied; expired draft writes do not run. Every bank mutation and parent deletion is denied for existing sessions, results, or a durable marker even after cleanup. Concurrent settings changes are rechecked before recording results.
3. Legitimate controls/regressions: pre-deadline submission, unused-bank mutation, response-loss draft acknowledgment, resumed sessions, held-score result recovery, and verified expiry recovery after evidence pruning passed. Integrated suite: 261 tests across 31 files passed, including the subsequently implemented manual-grading workflow.
4. Database substitute: non-mutating checks confirmed all eight existing sessions have deadline snapshots and no retained attempt history lacks a bank lock. The shared lock/guard SQL executed against the configured PostgreSQL database without creating, updating, or deleting records.

## Remaining limits

- Tests use mocked authenticated API calls, not a real browser/camera walkthrough or a live concurrent load benchmark. Validate refresh, final-save timing, network interruption, and result recovery with test accounts before high-stakes deployment.
- At/after the deadline, unsaved browser changes cannot be accepted. Browser auto-submit can arrive after expiry; only the last confirmed server save is then graded. Learners are told this explicitly.
- Expiry is enforced when APIs are used; there is no background worker automatically finalizing an abandoned page at the exact deadline.
- Backfills cannot reconstruct evidence or historical attempt records already erased before these migrations. Legacy incomplete answer histories cannot be safely manually graded.
- This is targeted remediation, not a new complete security audit. No unrelated user changes were reverted.
