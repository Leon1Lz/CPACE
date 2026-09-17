# Program demo materials

These original, introductory exercises are unofficial demo content, not accredited CPACE curricula or certification preparation guarantees. Organizations and data are fictional. An instructor should review accuracy, difficulty, and alignment before adapting them for teaching.

Find three `[DEMO]` courses under **Admin → Courses & Assessments**, in the draft filter:

- Certified Financial Management Specialist (CFMS): statements, budgets, cash planning and controls.
- Certified Marketing Management Specialist (CMMS): audience research, campaign economics and fair testing.
- Certified Operational Management Specialist (COMS): process capacity, inventory metrics and improvement pilots.

Each course has three lessons (80 minutes total), a three-question practice quiz, and a written assignment (short answer + essay). All courses start DRAFT; all assessments start unpublished. Modules are marked published inside the draft course for preview. No accounts, enrollments, attempts, or certificates are created. Existing courses are untouched.

## Testing the learner and grading workflows

1. Review/edit a demo course and its questions using the existing course/module and assessment management screens.
2. To test with an authorized test learner, publish that demo course and its desired assessment, then enroll the test learner using existing enrollment controls. Do not publish to production learners unintentionally.
3. Submit the practice quiz as the learner to exercise automatic grading. Submit the written assignment to exercise **Grading Queue → Awaiting grading**.
4. Grade each written response and deliberately release assignment scores using existing controls. Assignment scores start withheld. These demo assessments do not require motion capture and are not certification final exams.

Exam Monitor simulation is separate: it does not create real learner submissions for the Grading Queue.

## Instructor scoring guides

CFMS short answer (5): cash formula 2, correct result 2, interpretation 1. Memo (10): cash/profit distinction 2, two viable options 4, risks 2, missing facts 2.

CMMS short answer (5): A conversion 2, B conversion 2, test limitation 1. Campaign brief (10): audience/value 2, channel/budget 2, measurable objective 2, fair test 3, ethical safeguard 1.

COMS short answer (5): utilization calculation/result 3, queue/variability explanation 2. Proposal (10): constraint evidence 2, intervention 2, measurable pilot 2, quality guardrail 2, trade-off/fallback/assumptions 2.

## Repeatable setup

Run `npm run db:seed:demo`. The dedicated script requires the active primary admin and creates only missing demo courses in a transaction. Existing demo courses, including edits, deleted child records, and publication decisions, are preserved. Identifier collisions abort the transaction. Do not run the general seed/reset commands for this workflow.
