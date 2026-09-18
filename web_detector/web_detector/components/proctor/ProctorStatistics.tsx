import { Activity, AlertTriangle, Flag, Users } from 'lucide-react';

export function ProctorStatistics({
  active,
  flagged,
  events,
}: {
  active: number;
  flagged: number;
  events: number;
}) {
  const stats = [
    {
      label: 'Active examinees',
      value: active,
      icon: Users,
      color: 'text-[#105C2E] bg-green-50',
    },
    {
      label: 'Flagged',
      value: flagged,
      icon: Flag,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Proctoring events',
      value: events,
      icon: AlertTriangle,
      color: 'text-red-700 bg-red-50',
    },
    {
      label: 'Exam status',
      value: 'In progress',
      icon: Activity,
      color: 'text-[#105C2E] bg-green-50',
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <span className={`rounded-lg p-2 ${color}`}>
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
