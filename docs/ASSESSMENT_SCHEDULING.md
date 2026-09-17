# Assessment scheduling and question editing

Open Dashboard > Courses & Assessments > the assessment's question-management page.

In Edit Assessment Details, set Start date and time and End date and time, then save. These use the browser/device timezone displayed beside the inputs and are stored as UTC instants. Either boundary can be blank. The end must be strictly after the start when both are present. Scheduling does not publish an unpublished assessment.

The start is inclusive; the end is exclusive for new attempts. The backend denies early/late starts, including requests made without the UI. Already-active attempts can resume and submit after the availability window closes, using their original timer. This is an admission window, not a forced submission deadline. Learners see the schedule in exam setup.

Each question has an Edit button. The dialog loads its current text, type, points, options, and correct answer; saving updates that question instead of adding a duplicate. Option updates commit atomically. Invalid input and failed requests leave the dialog and edits available for retry.

All question mutations (add/edit/delete/CSV import) are allowed only before any attempt starts, to avoid invalidating option identifiers, draft answers, and historical scores. A permanent bank lock survives abandoned/flagged session cleanup. Assessment and parent-course deletion also reject protected histories. Once attempts begin, use a new assessment for changed questions, type, time limit, or passing score. Schedule boundaries and score-release settings remain editable. This is an immutable-used-bank policy, not a multi-version question bank.

Admins manage all assessments. Instructors can manage only assessments belonging to their own courses. Learners and proctors cannot change schedules or questions.

Migration `20260917150000_assessment_schedule` adds nullable schedule columns; existing assessments remain unscheduled and no records are deleted.

Timed sessions now persist a server deadline. Late draft writes are denied; late submissions recover only the last server-saved draft and cannot accept new answer input or a forged start time. Deadline snapshots do not change on refresh. See `ASSESSMENT_INTEGRITY_FIXES.md` for verification and limitations, and `MANUAL_GRADING.md` for written-answer review.
