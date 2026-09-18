'use client';

import type { ChatMessage, ChatSenderRole } from '@/types/chat';
import { Send } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export function ChatConversation({ messages, viewerId, receiverRole, onSend }: {
  messages: ChatMessage[]; viewerId: string; receiverRole: ChatSenderRole;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages.length]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };
  return (
    <>
      <div className="h-72 space-y-3 overflow-y-auto bg-slate-50/70 p-4" aria-live="polite">
        {messages.map((item) => {
          const mine = item.senderId === viewerId;
          return <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${mine ? 'rounded-br-md bg-[#105C2E] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
              <p>{item.message}</p>
              <p className={`mt-1 text-[10px] ${mine ? 'text-slate-300' : 'text-slate-400'}`}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>;
        })}
        {messages.length === 0 && <p className="py-12 text-center text-xs text-slate-400">No messages yet. Start the conversation below.</p>}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 bg-white p-3">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${receiverRole}...`} aria-label="Chat message" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#105C2E]" />
        <button type="submit" disabled={!draft.trim()} aria-label="Send message" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#105C2E] text-white disabled:opacity-40"><Send className="h-4 w-4" /></button>
      </form>
    </>
  );
}
