# CPACE system review — 18 September 2026

Overall engineering-readiness rating: **6/10**. This is a qualitative judgment,
not a benchmark, certification, penetration-test result, or deployment approval.

| Area | Rating | Basis |
| --- | --- | --- |
| Learning workflows | 8/10 | Courses, groups, paths and server-side prerequisite checks exist. |
| Assessments and grading | 8/10 | Scheduling, deadlines, saved drafts, question-bank locks and manual grading are implemented and regression-tested. |
| Portal navigation/design | 7/10 | Branding and workflow groups are implemented; latest changes were not visually inspected on real devices in this review. |
| Proctoring | 6/10 | Assigned access, gallery, incidents, chat and health states exist; real-camera/NAT and concurrency acceptance remains pending. |
| Automated verification | 8/10 | TypeScript, regression suite and production build pass; mocked tests do not replace authenticated end-to-end journeys. |
| Security readiness | 5/10 | Two findings patched below; invitation ownership, recovery identity and private materials remain deployment blockers. |
| Deployment/scaling readiness | 4/10 | Production hosting, durable/shared state, delivery, backups, monitoring and realistic concurrent-camera load are not established. |

## Scope and limitations

The Standard security review prioritized authentication, authorization, uploads,
HTML rendering, privacy and exam-state boundaries in the current working tree.
Coverage is **partial**, not an exhaustive review of the 591-file repository.
Remaining UI, nested landing/detector applications, migrations, unreviewed routes
and dependency-vulnerability assessment need follow-up. Source review was
offline; no production data, accounts or configuration were modified.

The pre-patch scan is `7ef785f6-df70-488b-9715-1550f9341854`.
Its generated report is in the local temporary Codex Security scan bundle.
The sealed report describes the **pre-patch** state; it has not been rewritten to
claim remediation. Daybreak access returned `not_granted`, with no programs;
protected results may not be displayable. Scan token usage is tool-reported and
not a security-quality metric. The workbench reported 4,985,383 total tokens
across four threads, including 4,482,176 cached input tokens; these rollout-derived
figures are not an incremental-cost estimate for the patch.

## Validated findings and current disposition

1. **High — pre-approved registration does not prove mailbox ownership.**
   Knowing an unused invited email permits creating an active account with its
   approved role and a caller-chosen password, including administrator when
   such an invitation exists. Submitted role is ignored, which prevents role
   injection but does not establish invitee identity. **Open:** use expiring,
   single-use mailbox-delivered invitations or verified email before activation;
   consume approval atomically. Mail-provider setup and onboarding behavior need
   to be resolved before deployment.

2. **Medium — session authorization uses mutable cached email. Fixed.**
   Authentication checks the original account ID, whereas API actor lookup used
   email. Email reuse while the old session remains active could select a
   replacement account. All 45 affected API route files now resolve actors by
   `session.user.id` or its existing `auth`/`authSession` alias, including the
   learning-path `getEditor` helper. Current database roles and resource scopes
   are retained. JWT claims refresh from the same ID-verified account; malformed
   identities fail closed. Login, registration and email-uniqueness queries still
   legitimately use email.

3. **Medium — reset tokens follow reusable email. Open.**
   A token issued for one account can target a replacement account if its email
   is reassigned during the token's one-hour validity. Tokens are random, hashed,
   expiring and atomically consumed, but their principal binding is still email.
   Fixing API identity selection does **not** fix recovery. Add immutable account
   binding and coordinate issuance/redemption with account lifecycle changes.
   Cleanup on profile changes alone is insufficient because deletion and races
   also free addresses.

4. **Medium — assessment materials are public static files. Open.**
   Upload creation is authorized, bounded and format-checked, but subsequent
   `/uploads/...` reads are anonymous. Random filenames are not authorization.
   Four existing files were identified by metadata only; none were deleted or
   moved. Add protected private storage/downloads, preserve enrollment,
   publication and learning-path checks, and migrate legacy public URLs/files.

5. **Medium — learners can clear staff exam flags. Fixed.**
   Learner violation PATCH now requires a strict, bounded payload with
   `flagged: true`, an owned learner session and `IN_PROGRESS` status. An atomic
   conditional write rechecks ownership/lifecycle. It sets the warning without
   replacing staff reasons, then appends the incident and existing audit event.
   An initially missing gallery reason may be filled only through a conditional
   null-reason write, so a concurrent staff reason cannot be overwritten.
   Learners cannot clear flags or mutate finished monitoring sessions through
   this route. Assigned proctor/admin review remains a separate staff endpoint.

## Verification

- `npm run type-check`: passed.
- Focused identity/session/violation tests: 25 passed.
- `npm test`: 285 tests passed across 33 files.
- `npm run build`: passed; existing middleware-to-proxy deprecation remains.
- `npm run check:portal:runtime`: 26 non-mutating localhost checks passed;
  authenticated journeys and browser/camera acceptance were not exercised.
- Focused API/auth/test lint: no errors, 30 warnings in the reviewed scope.
- Independent patch review found no surviving bypass; its missing-gallery-reason
  regression was addressed with a conditional null-reason write and regression.

The two-account regression substitutes a cached email belonging to a privileged
replacement account: profile GET/PATCH/DELETE still select the original ID and
admin mutation is denied. Flag regressions reject false/null, coercion,
oversized/extra fields, foreign sessions, ended sessions and a submission race;
ordinary violation reporting still records its incident/audit. These are local
mocked boundary tests, not live attacks or real-camera acceptance.

## Deployment priorities for 150–300 learners

We should first close the three open security findings, then validate production
operation. At the current three-second snapshot cadence, 150–300 simultaneous
exam takers would send roughly 50–100 snapshot requests per second before draft
saves, authentication checks, gallery polling or realtime traffic. Total enrolled
learners and simultaneous exam takers must be distinguished.

Live snapshots and rate limits are process-local; uploads are local disk files.
Restart/multi-instance behavior therefore requires an explicit shared-state and
durability strategy. We should also unify `SMTP_PASSWORD` versus `SMTP_PASS`,
verify actual mail delivery/domain configuration, define trusted forwarded-IP
handling, test WebRTC across real networks, schedule evidence/certificate work,
and rehearse backups/restores and monitoring. The 250-person simulator establishes
layout/workflow behavior, **not** production capacity.

No database migration, mail-provider change, account activation-policy change,
public-file deletion or credential rotation was performed in this pass.
