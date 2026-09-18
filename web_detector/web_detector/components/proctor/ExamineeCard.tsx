import type { ExamineeMonitoringStatus } from '@/types/proctoring';
import { Camera, Circle, Flag, WifiOff } from 'lucide-react';

const style = {
  normal: 'border-slate-200',
  warning: 'border-amber-300 ring-1 ring-amber-100',
  high: 'border-red-300 ring-1 ring-red-100',
  offline: 'border-slate-300 opacity-70',
};
export function ExamineeCard({
  item,
  onClick,
}: {
  item: ExamineeMonitoringStatus;
  onClick: () => void;
}) {
  const latest = item.events[0];
  return (
    <button
      onClick={onClick}
      className={`overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style[item.monitoringStatus]}`}
    >
      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-[#174F2F] to-[#0A2F1C]">
        <Camera className="h-8 w-8 text-white/25" />
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
          Live preview placeholder
        </span>
        {item.monitoringStatus !== 'normal' && (
          <span
            className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${item.monitoringStatus === 'high' ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-950'}`}
          >
            {item.monitoringStatus === 'high' ? 'High priority' : 'Warning'}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">{item.name}</h3>
            <p className="text-[11px] text-slate-400">{item.examineeId}</p>
          </div>
          <span title={item.connected ? 'Monitoring active' : 'Offline'}>
            {item.connected ? (
              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-slate-400" />
            )}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Exam progress</span>
            <strong className="text-slate-700">
              {item.examProgress} / {item.totalQuestions}
            </strong>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#105C2E]"
              style={{
                width: `${(item.examProgress / item.totalQuestions) * 100}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="truncate text-slate-500">
              {latest ? latest.type : 'No recent events'}
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <Flag className="h-3 w-3" />
              {item.warningCount}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
