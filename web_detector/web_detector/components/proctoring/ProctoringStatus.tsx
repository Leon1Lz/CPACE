import { ShieldCheck } from 'lucide-react';

export function ProctoringStatus({ active, loading, error }: { active: boolean; loading: boolean; error?: string }) {
  const label = error ? 'Camera unavailable' : loading ? 'Starting monitoring…' : active ? 'Proctoring active' : 'Ready to begin';
  return <div className="flex items-start gap-3"><span className={`monitoring-dot mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-green-50 text-[#105C2E]' : error ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}><ShieldCheck className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-slate-800">{label}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{error ?? (active ? 'Video is analyzed locally on this device.' : 'Camera access is required to start.')}</p></div></div>;
}
