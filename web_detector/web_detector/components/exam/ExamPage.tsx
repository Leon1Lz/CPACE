'use client';

import { examData } from '@/lib/exam-data';
import type { ProctoringEvent } from '@/types/proctoring';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CircleHelp,
  Info,
  LockKeyhole,
  Clock3,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { ExamQuestion } from './ExamQuestion';
import { ExamTimer } from './ExamTimer';
import { WebcamMonitor } from '../proctoring/WebcamMonitor';
import { ProctoringEventLog } from '../proctoring/ProctoringEventLog';
import { DevelopmentNav } from '../shared/DevelopmentNav';
import { Calculator } from './Calculator';
import { ExamineeChat } from '../chat/ExamineeChat';
import { CPaceLogo } from '../shared/CPaceLogo';

export function ExamPage() {
  const [examPhase, setExamPhase] = useState<
    'start' | 'preparing' | 'camera-error' | 'active'
  >('start');
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [warning, setWarning] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);

  const onProctoringEvent = useCallback((event: ProctoringEvent) => {
    setEvents((current) => [event, ...current].slice(0, 30));
    setWarning(event.description);
    window.setTimeout(
      () =>
        setWarning((current) => (current === event.description ? '' : current)),
      5000,
    );
    // Integration point: POST event with authenticated user ID, examinee ID and exam ID.
    // Example: api.proctoringEvents.create({ examId: examData.id, examineeId, ...event })
  }, []);

  const submit = useCallback(() => {
    setSubmitted(true);
    setShowSubmit(false);
  }, []);
  const cameraReady = useCallback(() => setExamPhase('active'), []);
  const cameraError = useCallback(() => setExamPhase('camera-error'), []);
  const beginCameraSetup = useCallback(() => {
    setCameraAttempt((attempt) => attempt + 1);
    setExamPhase('preparing');
  }, []);
  const answered = Object.keys(answers).length;
  if (submitted)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F2F7F3] p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-[0_18px_50px_rgba(15,43,55,.08)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-[#105C2E]">
            <Check className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-slate-900">
            Exam submitted
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your responses have been saved. Proctoring events, if any, are
            available for authorized human review.
          </p>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Answered{' '}
            <strong>
              {answered} of {examData.questions.length}
            </strong>{' '}
            questions
          </div>
        </div>
      </main>
    );

  if (examPhase === 'start')
    return (
      <main className="min-h-screen bg-[#F5F8F6] pb-20">
        <DevelopmentNav />
        <ExamBrandHeader />
        <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-12 lg:py-16">
          <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(23,45,55,.08)]">
            <div className="border-b border-slate-100 px-7 py-7 text-center sm:px-10">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#105C2E]">
                <BookOpenCheck className="h-6 w-6" />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[.16em] text-[#105C2E]">
                Monitored examination
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                {examData.title}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Examinee: <strong className="font-semibold text-slate-700">{examData.examinee}</strong>
              </p>
            </div>
            <div className="px-7 py-7 sm:px-10">
              <div className="grid gap-3 sm:grid-cols-2">
                <ExamDetail icon={<Clock3 className="h-4 w-4" />} label="Exam duration" value={`${Math.floor(examData.durationSeconds / 60)} minutes`} />
                <ExamDetail icon={<CircleHelp className="h-4 w-4" />} label="Questions" value={`${examData.questions.length} questions`} />
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 p-5">
                <h2 className="text-sm font-semibold text-slate-800">Before you begin</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>• Keep your face clearly visible and remain in the exam window.</li>
                  <li>• Allow camera access when prompted. The timer starts only when proctoring is ready.</li>
                  <li>• Complete the exam before time expires; it will submit automatically at 00:00.</li>
                </ul>
              </div>
              <p className="mt-7 text-center text-lg font-semibold text-slate-800">Good luck on your examination!</p>
              <button onClick={beginCameraSetup} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#105C2E] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#0B4523]">
                <ShieldCheck className="h-4 w-4" /> Start Exam
              </button>
            </div>
          </section>
        </div>
        <ExamineeChat />
      </main>
    );

  if (examPhase === 'preparing' || examPhase === 'camera-error')
    return (
      <main className="min-h-screen bg-[#F5F8F6] pb-20">
        <DevelopmentNav />
        <ExamBrandHeader />
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-4 lg:px-8">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{examData.title}</h1>
              <p className="mt-1 text-xs text-slate-500">Examinee: <span className="font-medium text-slate-700">{examData.examinee}</span></p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400">
              <Clock3 className="h-4 w-4" /> Timer locked
            </div>
          </div>
        </div>
        <div className="mx-auto grid max-w-[1500px] gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <div>
            <div className="mb-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
              <h1 className="text-lg font-semibold text-slate-900">
                {examPhase === 'camera-error' ? 'Camera access is required to start this monitored examination.' : 'Preparing your exam...'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {examPhase === 'camera-error' ? 'Allow camera access in your browser settings, then try again.' : 'Please allow camera access to continue.'}
              </p>
              {examPhase === 'camera-error' && (
                <button onClick={beginCameraSetup} className="mt-4 rounded-lg bg-[#105C2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B4523]">Try Again</button>
              )}
            </div>
            <ExamPreparationSkeleton />
          </div>
          <aside className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(23,45,55,.05)]">
            <WebcamMonitor key={cameraAttempt} active onEvent={onProctoringEvent} onReady={cameraReady} onError={cameraError} />
          </aside>
        </div>
        <ExamineeChat />
      </main>
    );

  return (
      <main className="min-h-screen bg-[#F5F8F6] pb-20">
      <DevelopmentNav />
      <ExamBrandHeader />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-900">
                {examData.title}
              </h1>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {examData.code}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Examinee:{' '}
              <span className="font-medium text-slate-700">
                {examData.examinee}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Time remaining
              </p>
              <p className="text-[11px] text-slate-500">Auto-submit at 00:00</p>
            </div>
            <Calculator />
            <ExamTimer
              seconds={examData.durationSeconds}
              running={examPhase === 'active'}
              onExpire={submit}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1500px] gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.13em] text-[#105C2E]">
                Domain 1 · Security principles
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Question {index + 1} of {examData.questions.length}
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {answered}/{examData.questions.length} answered
            </span>
          </div>
          <div className="mb-6 flex gap-2">
            {examData.questions.map((question, questionIndex) => (
              <button
                key={question.id}
                onClick={() => setIndex(questionIndex)}
                aria-label={`Go to question ${questionIndex + 1}`}
                className={`h-1.5 flex-1 rounded-full ${questionIndex === index ? 'bg-[#105C2E]' : answers[question.id] !== undefined ? 'bg-[#4F7A5E]' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(23,45,55,.045)] md:p-9">
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5">
              <span className="text-xs font-semibold text-slate-400">
                SELECT ONE ANSWER
              </span>
              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
                <CircleHelp className="h-4 w-4" />
                Help
              </button>
            </div>
            <ExamQuestion
              question={examData.questions[index]}
              value={answers[examData.questions[index].id]}
              onChange={(answer) =>
                setAnswers((current) => ({
                  ...current,
                  [examData.questions[index].id]: answer,
                }))
              }
            />
            <div className="mt-9 flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                disabled={index === 0}
                onClick={() => setIndex((value) => value - 1)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
              {index < examData.questions.length - 1 ? (
                <button
                  onClick={() => setIndex((value) => value + 1)}
                  className="flex items-center gap-2 rounded-lg bg-[#105C2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B4523]"
                >
                  Next question
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmit(true)}
                  className="flex items-center gap-2 rounded-lg bg-[#105C2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B4523]"
                >
                  <Send className="h-4 w-4" />
                  Submit exam
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white/60 p-4 text-xs leading-5 text-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            Your progress is retained in this demonstration session. In
            production, connect answer updates to the exam API.
          </div>
        </section>
        <aside className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(23,45,55,.05)] lg:sticky lg:top-6">
          <WebcamMonitor key={cameraAttempt} active onEvent={onProctoringEvent} onReady={cameraReady} onError={cameraError} />
          {warning && (
            <div
              role="alert"
              className="mx-5 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900"
            >
              <strong className="block font-semibold">
                Please check your position
              </strong>
              {warning}
            </div>
          )}
          <ProctoringEventLog events={events} />
        </aside>
      </div>
      {showSubmit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Submit your exam?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You answered {answered} of {examData.questions.length} questions.
              Submission stops camera monitoring and cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmit(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Continue exam
              </button>
              <button
                onClick={submit}
                className="rounded-lg bg-[#105C2E] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Submit exam
              </button>
            </div>
          </div>
        </div>
      )}
      <ExamineeChat />
    </main>
  );
}

function ExamBrandHeader() {
  return (
    <header className="border-b border-slate-200 bg-[#105C2E] text-white">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <CPaceLogo compact />
        <div className="hidden items-center gap-2 text-xs text-slate-300 sm:flex">
          <LockKeyhole className="h-3.5 w-3.5 text-green-300" /> Secure exam session
        </div>
      </div>
    </header>
  );
}

function ExamDetail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-[#105C2E]">{icon}</span>
      <div><p className="text-xs text-slate-500">{label}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p></div>
    </div>
  );
}

function ExamPreparationSkeleton() {
  return (
    <section aria-label="Exam content is locked while the camera connects" className="pointer-events-none min-w-0 select-none blur-[1px]" aria-busy="true">
      <div className="mb-5 flex items-center justify-between">
        <div className="space-y-2"><div className="h-3 w-48 animate-pulse rounded bg-slate-200" /><div className="h-3 w-28 animate-pulse rounded bg-slate-200" /></div>
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mb-6 h-1.5 w-full animate-pulse rounded-full bg-slate-200" />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(23,45,55,.045)] md:p-9">
        <div className="mb-8 h-3 w-32 animate-pulse rounded bg-slate-200" />
        <div className="space-y-4 border-t border-slate-100 pt-7">
          <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-3/5 animate-pulse rounded bg-slate-200" />
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      </div>
    </section>
  );
}
