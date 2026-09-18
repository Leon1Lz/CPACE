'use client';

import { mockExaminees } from '@/data/mock-proctor-data';
import type {
  ExamineeMonitoringStatus,
  ProctoringEvent,
} from '@/types/proctoring';
import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DevelopmentNav } from '../shared/DevelopmentNav';
import { ExamineeCard } from './ExamineeCard';
import { ExamineeDetails } from './ExamineeDetails';
import { LiveEventFeed } from './LiveEventFeed';
import { ProctorStatistics } from './ProctorStatistics';
import { ProctorMessages } from '../chat/ProctorMessages';
import { DEMO_EXAMINEE_ID } from '@/lib/demo-chat-store';
import type { ChatParticipant } from '@/types/chat';
import { CPaceLogo } from '../shared/CPaceLogo';

const priority = { high: 0, warning: 1, offline: 2, normal: 3 };
const chatParticipants: ChatParticipant[] = [
  { id: DEMO_EXAMINEE_ID, name: 'Jordan Lee', role: 'examinee', online: true, examStatus: 'Exam active' },
  ...mockExaminees.map((item) => ({ id: item.examineeId, name: item.name, role: 'examinee' as const, online: item.connected, examStatus: item.connected ? 'Exam active' : 'Offline' })),
];
export function ProctorDashboard() {
  const [examinees, setExaminees] = useState(mockExaminees),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState('all'),
    [eventFilter, setEventFilter] = useState('all');
  const events = useMemo(
    () =>
      examinees
        .flatMap((x) => x.events)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [examinees],
  );
  const visible = useMemo(
    () =>
      examinees
        .filter(
          (x) =>
            (status === 'all' || x.monitoringStatus === status) &&
            `${x.name} ${x.examineeId}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort(
          (a, b) => priority[a.monitoringStatus] - priority[b.monitoringStatus],
        ),
    [examinees, search, status],
  );
  const filteredEvents = events.filter((e) =>
    eventFilter === 'all' || eventFilter === 'high'
      ? eventFilter === 'all' || e.severity === 'high'
      : eventFilter === 'warning'
        ? e.severity === 'warning'
        : e.type.toLowerCase().includes(eventFilter),
  );
  const updateExamineeStatus = (
    examineeId: string,
    patch: Partial<ExamineeMonitoringStatus>,
  ) =>
    setExaminees((list) =>
      list.map((x) => (x.examineeId === examineeId ? { ...x, ...patch } : x)),
    );
  const markEventReviewed = (eventId: string) =>
    setExaminees((list) =>
      list.map((x) => ({
        ...x,
        events: x.events.map((e) =>
          e.id === eventId ? { ...e, reviewed: true } : e,
        ),
      })),
    );
  const markExamineeReviewed = (examineeId: string) =>
    updateExamineeStatus(examineeId, { reviewed: true });
  // Integration points: replace mock state with your API. Subscribe through WebSocket,
  // Supabase Realtime, Firebase or Socket.IO and call onProctoringEventReceived(event).
  const onProctoringEventReceived = (_event: ProctoringEvent) => {
    /* append incoming event in production */
  };
  void onProctoringEventReceived;
  const selected = examinees.find((x) => x.examineeId === selectedId);
  return (
    <main className="min-h-screen bg-[#F5F8F6] pb-20">
      <DevelopmentNav />
      <header className="bg-[#105C2E] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <CPaceLogo compact />
            <p className="hidden text-[10px] font-semibold uppercase tracking-[.16em] text-green-100 sm:block">Proctor · Live monitoring console</p>
          </div>
          <span className="rounded-full bg-green-400/15 px-3 py-1 text-[10px] font-semibold uppercase text-green-200">
            Demo mode
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] space-y-5 px-6 py-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Certified Security Professional
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor active exam sessions and prioritize events for human review.
          </p>
        </div>
        <ProctorStatistics
          active={examinees.filter((x) => x.connected).length}
          flagged={
            examinees.filter((x) =>
              ['warning', 'high'].includes(x.monitoringStatus),
            ).length
          }
          events={events.length}
        />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search examinees…"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-transparent py-2.5 text-sm text-slate-600 outline-none"
                >
                  <option value="all">All statuses</option>
                  <option value="normal">Normal</option>
                  <option value="warning">Warning</option>
                  <option value="high">High priority</option>
                  <option value="offline">Offline</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visible.map((item) => (
                <ExamineeCard
                  key={item.examineeId}
                  item={item}
                  onClick={() => setSelectedId(item.examineeId)}
                />
              ))}
            </div>
          </section>
          <aside className="space-y-5">
            <ProctorMessages participants={chatParticipants} />
            <div>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none"
            >
              <option value="all">All events</option>
              <option value="warning">Warning</option>
              <option value="high">High priority</option>
              <option value="no face">No face</option>
              <option value="multiple faces">Multiple faces</option>
              <option value="looking">Looking away</option>
              <option value="focus">Tab / window change</option>
            </select>
            <LiveEventFeed
              events={filteredEvents}
              nameFor={(id) =>
                examinees.find((x) => x.examineeId === id)?.name ?? id
              }
              onReview={markEventReviewed}
            />
            </div>
          </aside>
        </div>
      </div>
      {selected && (
        <ExamineeDetails
          item={selected}
          onClose={() => setSelectedId(null)}
          onReview={() => markExamineeReviewed(selected.examineeId)}
          onReviewEvent={markEventReviewed}
        />
      )}
    </main>
  );
}
