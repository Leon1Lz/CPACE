'use client';

import { Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ExamTimer({ seconds, running, onExpire }: { seconds: number; running: boolean; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [running, remaining]);
  useEffect(() => { if (remaining === 0) onExpire(); }, [remaining, onExpire]);
  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  return <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><Clock3 className="h-4 w-4 text-[#105C2E]" />{minutes}:{secs}</div>;
}
