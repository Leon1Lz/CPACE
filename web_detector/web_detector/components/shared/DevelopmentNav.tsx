'use client';

import { ClipboardCheck, Monitor } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function DevelopmentNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Development views"
      className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-white/20 bg-[#0B4523]/95 p-1 shadow-xl backdrop-blur"
    >
      <a
        href="/exam"
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${path !== '/proctor' ? 'bg-white text-[#105C2E]' : 'text-slate-200 hover:bg-white/10'}`}
      >
        <ClipboardCheck className="h-3.5 w-3.5" />
        Examinee
      </a>
      <a
        href="/proctor"
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${path === '/proctor' ? 'bg-white text-[#105C2E]' : 'text-slate-200 hover:bg-white/10'}`}
      >
        <Monitor className="h-3.5 w-3.5" />
        Proctor
      </a>
    </nav>
  );
}
