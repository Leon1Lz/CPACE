import type { ProctoringEvent } from '@/types/proctoring';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatEventTime } from '@/lib/format-event-time';

export function LiveEventFeed({
  events,
  nameFor,
  onReview,
}: {
  events: ProctoringEvent[];
  nameFor: (id: string) => string;
  onReview: (id: string) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-800">Live proctoring events</h2>
        <p className="mt-1 text-xs text-slate-400">
          Newest activity appears first
        </p>
      </div>
      <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
        {events.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">No matching events</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex gap-3 p-4">
              <span
                className={`mt-0.5 rounded-lg p-2 ${event.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}
              >
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {nameFor(event.examineeId)}
                  </p>
                  <time className="shrink-0 text-[10px] text-slate-400">
                    {formatEventTime(event.timestamp)}
                  </time>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  {event.type} ·{' '}
                  <span
                    className={
                      event.severity === 'high'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }
                  >
                    {event.severity === 'high' ? 'High priority' : 'Warning'}
                  </span>
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                  {event.description}
                </p>
              </div>
              <button
                onClick={() => onReview(event.id)}
                title="Mark event reviewed"
                className={`${event.reviewed ? 'text-green-500' : 'text-slate-300 hover:text-[#105C2E]'}`}
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
