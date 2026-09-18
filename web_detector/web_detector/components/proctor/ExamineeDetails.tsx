import type { ExamineeMonitoringStatus } from '@/types/proctoring';
import { Camera, CheckCircle2, X } from 'lucide-react';
import { formatEventTime } from '@/lib/format-event-time';

export function ExamineeDetails({
  item,
  onClose,
  onReview,
  onReviewEvent,
}: {
  item: ExamineeMonitoringStatus;
  onClose: () => void;
  onReview: () => void;
  onReviewEvent: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} monitoring details`}
        className="h-full w-full max-w-lg overflow-y-auto bg-[#f5f7f8] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#105C2E]">
              Examinee monitoring
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {item.name}
            </h2>
            <p className="text-xs text-slate-400">{item.examineeId}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-4 p-5">
          <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-[#174F2F] to-[#0A2F1C]">
            <Camera className="h-10 w-10 text-white/25" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Progress', `${item.examProgress}/${item.totalQuestions}`],
              ['Warnings', item.warningCount],
              ['Status', item.monitoringStatus],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <p className="text-[10px] uppercase text-slate-400">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-700">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Proctoring history
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {item.events.length === 0 ? (
                <p className="p-4 text-xs text-slate-400">
                  No events recorded.
                </p>
              ) : (
                item.events.map((event) => (
                  <div key={event.id} className="flex gap-3 p-4">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${event.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-xs font-semibold text-slate-700">
                          {event.type}
                        </p>
                        <time className="text-[10px] text-slate-400">
                          {formatEventTime(event.timestamp)}
                        </time>
                      </div>
                      <p className="mt-1 text-[11px] leading-4 text-slate-500">
                        {event.description}
                        {event.duration ? ` · ${event.duration}s` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => onReviewEvent(event.id)}
                      className={
                        event.reviewed ? 'text-green-500' : 'text-slate-300'
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
          <button
            onClick={onReview}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#105C2E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0B4523]"
          >
            <CheckCircle2 className="h-4 w-4" />
            {item.reviewed ? 'Reviewed' : 'Mark examinee as reviewed'}
          </button>
          <p className="text-center text-[10px] text-slate-400">
            Demo action only · Connect this control to your review API
          </p>
        </div>
      </aside>
    </div>
  );
}
