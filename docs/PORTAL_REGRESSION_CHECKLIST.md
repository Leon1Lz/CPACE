# Portal regression and acceptance checklist

## Verified locally

| Area | Evidence | Limit |
| --- | --- | --- |
| Role access | Automated admin/instructor/learner/proctor route tests | Mocked sessions and database responses, not browser logins |
| Learning paths | Prerequisites, completion, direct continuation, progress ownership tests | Real learner walkthrough pending |
| Assessment recovery | Versioned drafts, retry/conflict, resume timer, idempotent submission tests | Real browser refresh/network outage pending |
| Proctor workflow | Scope isolation, review/chat boundaries, UI errors, simulated sessions | Synthetic sessions do not test camera bandwidth |
| Reporting | Date/CSV helpers, role scope, held scores, UI failure tests; read-only database reconciliation | Authenticated dashboard/export walkthrough pending |
| Session expiry | Suspended/missing users, replaced sessions, valid session, database failure tests | Real browser logout/replacement pending |
| Mobile navigation | Four roles at a mocked 390px viewport; drawer, branding, links, exam lock | JSDOM cannot validate pixels, camera permissions, or touch behavior |
| Manual grading | Admin/instructor ownership, complete marks, bounds, finalized/held results, feedback, certificate, pending-count and UI retry tests | Real instructor/learner walkthrough pending |
| Exam integrity | Late-answer injection, timed sessionless bypass, immutable banks/history cleanup, parent cascades, settings races, retention recovery | Mocked authenticated API tests; real-device expiry/network acceptance pending |
| Build | TypeScript, 261 tests in 31 files, production build | Not a production deployment check |

## Repeatable commands

```powershell
npm run check:portal
npm run check:portal:data
# In another terminal, after npm run dev:
npm run check:portal:runtime
```

Database checks are read-only. Runtime smoke checks use no credentials and create no exam records; they check public pages, logo delivery, login redirects, and unauthenticated API rejection. Authenticated journeys are not exercised by that script.

## Pending browser/device acceptance

1. Admin: sign in, verify the real dashboard chart, filter Reports dates, download each CSV, and create/remove a proctor course/group assignment. Check the downloaded columns and scope.
2. Instructor: verify only owned courses and reporting data; download enrollment/result exports; confirm no user-directory export is available.
3. Learner: open My Progress, follow a learning path, confirm a locked step is denied, and review a completed course. Verify held results remain hidden.
4. Learner exam: answer questions, wait for Saved, refresh and resume, verify original timer and answers, interrupt connectivity, reconnect, then submit once and retry confirmation. Use test accounts/exams; final exams still require camera/identity/consent setup.
5. Proctor/admin on a second device: watch the learner's live camera, detector events, health labels, chat, and incident notes. Test course/group isolation and assignment removal. Existing provider subscriptions are not instantly revoked; inline monitors normally close on the next session-list refresh (within 30 seconds).
6. At 390px and tablet/desktop widths: inspect the logo, sidebar, reports tables/date controls, exam controls, monitor gallery, and chat. Confirm no clipped buttons or overlapping panels.
7. Sign out, suspend a test user, and replace a session from another browser. Confirm old sessions cannot read protected APIs and the UI offers sign-in/recovery.
8. Test actual concurrent camera streams at the intended deployment capacity. The 12/50/100/250 simulator is a layout/workflow aid, not a real-stream load test.
9. Admin/instructor grading: submit a mixed choice/essay test exam, open Grading Queue, assign all written marks and feedback, confirm the full weighted score and pending-count change. Verify a foreign instructor/proctor/learner cannot grade it; verify duplicate finalization does not change the result.
10. Held grading: finalize a held result, confirm the learner cannot see score or feedback in My Progress/learning-path best scores, explicitly release it as admin, then confirm feedback/final score and eligible certificate. Scheduled future score visibility is supported; automatic future certificate/notification delivery still needs a background release job.
11. Expiry: save an answer, let the server deadline pass, attempt a new save (denied), and submit/retry. Only the saved pre-deadline draft should be graded; unsaved final edits must not be accepted. Confirm cleanup cannot unlock an already-used question bank and a protected course/assessment cannot be deleted.

These checks need browser/camera access and suitable test accounts. They remain open until observed; report errors/screenshots with the role, page, and reproduction steps.
