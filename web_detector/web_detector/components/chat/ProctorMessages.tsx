'use client';

import { useDemoChat } from '@/hooks/use-demo-chat';
import { DEMO_EXAMINEE_ID, DEMO_PROCTOR_ID } from '@/lib/demo-chat-store';
import type { ChatParticipant } from '@/types/chat';
import { ArrowLeft, MessageCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ChatConversation } from './ChatConversation';

export function ProctorMessages({ participants }: { participants: ChatParticipant[] }) {
  const { messages, send, markRead } = useDemoChat(DEMO_PROCTOR_ID);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const threads = useMemo(() => participants.map((participant) => {
    const conversation = messages.filter((message) =>
      (message.senderId === participant.id && message.receiverId === DEMO_PROCTOR_ID) ||
      (message.senderId === DEMO_PROCTOR_ID && message.receiverId === participant.id));
    return { participant, conversation, latest: conversation.at(-1), unread: conversation.filter((message) => message.receiverId === DEMO_PROCTOR_ID && !message.read).length };
  }).filter((thread) => thread.conversation.length > 0 || thread.participant.id === DEMO_EXAMINEE_ID)
    .sort((a, b) => (b.latest?.timestamp ?? '').localeCompare(a.latest?.timestamp ?? '')), [messages, participants]);
  const selected = threads.find((thread) => thread.participant.id === selectedId);
  const totalUnread = threads.reduce((total, thread) => total + thread.unread, 0);
  useEffect(() => { if (selectedId) markRead(selectedId); }, [markRead, messages.length, selectedId]);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
        <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#105C2E]" /><h2 className="text-sm font-semibold text-slate-800">Messages</h2>{totalUnread > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{totalUnread}</span>}</div>
        {selected && <button onClick={() => setSelectedId(null)} aria-label="Close conversation" className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
      </div>
      {selected ? (
        <div>
          <button onClick={() => setSelectedId(null)} className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-3 text-left">
            <ArrowLeft className="h-4 w-4 text-slate-400" /><span><strong className="block text-sm text-slate-800">{selected.participant.name}</strong><span className="text-[11px] text-slate-400">{selected.participant.id} · {selected.participant.online ? 'Online' : 'Offline'} · {selected.participant.examStatus}</span></span>
          </button>
          <ChatConversation messages={selected.conversation} viewerId={DEMO_PROCTOR_ID} receiverRole="examinee" onSend={(message) => send(selected.participant.id, 'proctor', message, selected.conversation[0]?.proctoringSessionId)} />
        </div>
      ) : (
        <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
          {threads.map(({ participant, latest, unread }) => <button key={participant.id} onClick={() => setSelectedId(participant.id)} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${unread ? 'bg-green-50/60' : ''}`}>
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{participant.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}<span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${participant.online ? 'bg-green-500' : 'bg-slate-300'}`} /></span>
            <span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><strong className="truncate text-sm text-slate-800">{participant.name}</strong><time className="shrink-0 text-[10px] text-slate-400">{latest ? new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</time></span><span className="block text-[10px] text-slate-400">{participant.id} · {participant.examStatus}</span><span className={`mt-1 block truncate text-xs ${unread ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{latest?.message ?? 'No messages yet'}</span></span>
            {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </button>)}
        </div>
      )}
    </section>
  );
}
