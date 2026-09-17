# Learning portal upgrade roadmap

Implement and validate one stage at a time, preserving existing role boundaries.

1. Learning paths and prerequisites: backend checks on course/module access, exam start/submission, and progress updates; shared completion rules; direct continuation from the learner dashboard. Implemented and locally validated (59 tests, type checking, focused backend lint, production build). Authenticated walkthrough remains part of stage 5.
2. Assessment reliability: versioned server-backed answer autosave, automatic failed-save retry, refresh recovery on resume, original server start time, concurrent-start protection, and idempotent submission confirmation. Implemented; local automated validation recorded below. Authenticated walkthrough remains part of stage 5.
3. Proctor workflow: admin-managed course/group assignments, scoped incident queue with review notes, connection/camera/detector health, visible-tile camera polling, 12–250 examinee simulation, and concurrent mocked-request isolation tests. Implemented and locally validated; real multi-camera capacity testing remains outstanding.
4. Reporting: actual daily enrollment activity, date-filtered completion/pass rates, and scoped CSV exports. Implemented and locally validated; reporting definitions are below.
5. Role-based regression testing: automated admin/instructor/learner/proctor access and UI checks, mobile navigation, session expiry/replacement, missing data, and failed requests. Automated checks implemented. Authenticated browser journeys, visual mobile layouts, and real camera checks remain pending; see `PORTAL_REGRESSION_CHECKLIST.md`.

## Prerequisite policy

- Only published learning paths assigned through the learner's groups impose prerequisites.
- Earlier incomplete required steps lock later incomplete steps. Optional steps do not block progression.
- Completed steps remain available for review.
- Explicit assessment steps take precedence over their parent course step.
- A shared resource is available if at least one assigned path unlocks it.
- Standalone enrolled resources remain unaffected.
- Course completion counts verified published module identifiers; client-supplied percentages are not authoritative.
- Active and completed enrollments may take assessments, subject to publication, prerequisite, attempt, identity, consent, and proctoring checks.
- This is sequencing enforcement, not proof that a learner watched/read content or a completed production security audit.

## Assessment recovery policy

- Answers autosave after a short debounce to the learner's active exam session. Question/option ownership and enrollment/prerequisite access are checked on every save.
- A refresh returns to setup; starting again resumes the last server-saved answers and original start time. Final exams still require camera/identity/consent setup. Setup and offline time do not reset the countdown.
- Failed writes retry while the page stays open. An uncertain write is retried identically before newer edits; conflicting tabs cannot silently overwrite a newer draft.
- Unsaved answers exist only in page memory. Leaving during an outage can lose changes since the last confirmed save; a browser unload warning is installed. No answer or identity-photo copies are added to browser storage.
- Retrying submission with the same owned submitted session returns its authoritative result, without consuming another attempt or exposing held scores/answer keys. Submission clears the draft inside the result transaction.
- Migration `20260917120000_assessment_drafts` adds answer JSON and a version counter to existing exam sessions. It does not remove existing records.
- Local checks passed: 71 tests across 12 files, type checking, focused backend/autosave lint, and production build. Real camera/browser and authenticated end-to-end journeys remain to be tested.

## Proctor workflow policy and walkthrough

- As an admin, open **Exam Monitor → Manage proctor assignments**, choose an active proctor and course, optionally select a group already linked to the course, then save. No real coverage is automatically granted to existing proctors.
- Admins retain all-session access. Proctors with no assignments see no real sessions. Multiple assignments grant the union of their coverage; group-limited assignments require both the course match and the learner's current group membership. Historical access also follows current coverage/membership.
- Assignment controls support confirmed removal and preserve exam records. Changes and incident reviews record audit entries; review changes and their audit entry commit together.
- Session lists, gallery feeds, detail evidence, incident queues/reviews, chat, WebRTC signaling, and new realtime subscriptions enforce the same coverage checks. Bulk session responses do not select drafts, identity photos, IP addresses, or user agents.
- Dashboard alerts use individual private proctor channels; notifications are delivered only to currently assigned active proctors and admins. Old stored notifications are not purged by this upgrade.
- Coverage removal denies subsequent API calls/new subscriptions immediately. Existing third-party realtime subscriptions/peer connections are not revoked at the provider level; the detailed monitor unmounts on its next failed poll, and inline monitors close when the session list refreshes (normally within 30 seconds). Do not treat this as instantaneous provider-level revocation.
- The incident queue separates open/pending/escalated/resolved states, sorts high severity first and oldest first, and shows the first 50 matching incidents with the total count. Review an open incident to make room for the next; resolved-history pagination is not yet implemented. Review notes survive failed requests and status-only detail updates.
- Heartbeats and camera snapshots are distinct signals. Health labels show live/delayed/disconnected/connecting/ended, camera freshness, and detector status; an identity image or heartbeat alone is not a live camera feed. Gallery polling downloads snapshots only for visible tiles; list polling requests health metadata without images.
- The simulator supports 12, 50, 100, or 250 synthetic sessions across CFMS/CMMS/COMS and mixed connection states. It does not create records or exercise real WebRTC/camera bandwidth. Automated tests include 50 simultaneous mocked list calls, not a production load benchmark.
- Validation: 100 automated tests across 15 files, type checking, focused lint, production build, and `npx tsx scripts/check-proctor-scopes.ts` read-only database query checks. Authenticated role/camera/browser walkthroughs remain in stage 5; real multi-device capacity and immediate provider-level revocation need separate verification/work.
- Migration `20260917130000_proctor_assignments` is additive and has been applied locally to the configured database.

## Reporting definitions

- Admins see all reporting data; instructors see only their courses; learners see only their own progress and released scores. Proctors use their scoped dashboard and Exam Monitor, not the reports API.
- Date filters use Philippine calendar days (Asia/Manila), with inclusive start/end dates, a default last-30-day range, and a maximum 366-day range. The admin dashboard chart uses actual enrollment timestamps for the last seven days, including zero-activity days.
- Completion rate is the currently completed fraction of enrollments that started in the selected range, not completion events during that range. Dropped/suspended enrollments remain in that cohort denominator.
- Pass rate and average score are attempt-based and include finalized automatic and manual grades. Pending written-answer reviews and unreleased learner scores are excluded. Missing denominators display a dash, not a fabricated zero.
- CSV exports respect staff course scope and dates: users use account creation dates, enrollments use enrollment dates, and results use submission completion dates. User-directory export is admin-only; learners cannot export CSVs. Explicit selected columns omit passwords, exam answers, and identity evidence.
- CSV output uses UTF-8 BOM, quoted fields, and formula-prefix neutralization. Exports exceeding 10,000 rows fail explicitly rather than silently truncating.
- Report failures expose retry/sign-in controls; failed exports show errors instead of downloading error responses. Learners can open My Progress from the sidebar.
- Course/module/assessment read permissions now consistently require an active or completed learner enrollment; module access also requires a published parent course.

## Final automated verification

- Latest post-roadmap verification: 261 tests across 31 files passed; TypeScript checks and the production build passed. Focused integrity/grading source/test lint passed. Earlier broad focused lint had two warnings (an existing unused catch parameter and an intentional test image mock).
- Read-only reporting database checks reconciled all three enrollment records with daily activity and validated scoped group/aggregate queries. Proctor scope queries were also checked without changing records.
- All 26 local HTTP smoke checks passed, including the new grading page/API: public pages/logo returned 200, protected dashboard pages redirected to login, and unauthenticated APIs returned 401. These checks made no login attempts and created no records.
- Repeat with `npm run check:portal`, `npm run check:portal:data`, and (with the server running) `npm run check:portal:runtime`.
- Automated/mock coverage is not an authenticated browser walkthrough, a camera bandwidth benchmark, or proof of mobile visual correctness. Outstanding acceptance checks are listed separately rather than marked complete.

## Post-roadmap integrity and grading

- Server deadlines, expired saved-draft recovery, immutable-used question banks, protected historical cascades, and concurrency/settings guards: implemented; see `ASSESSMENT_INTEGRITY_FIXES.md`.
- Admin/instructor grading queue, full manual point/feedback review, finalized result state, held-score protection, scoped pending counts, and released passing-final certificate updates: implemented; see `MANUAL_GRADING.md`.
- Real camera scale, provider-level immediate revocation, production mail fallback behavior, and a background scheduled certificate/notification release job remain separate operational work. These are not marked finished by passing unit tests.
