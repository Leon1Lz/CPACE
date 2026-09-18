'use client';

import { useDemoChat } from '@/hooks/use-demo-chat';
import { DEMO_EXAMINEE_ID, DEMO_PROCTOR_ID, DEMO_PROCTOR_NAME } from '@/lib/demo-chat-store';
import { MessageCircle, Minus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ChatConversation } from './ChatConversation';

export function ExamineeChat() {
  const [open, setOpen] = useState(false);
  const { messages, send, markRead } = useDemoChat(DEMO_EXAMINEE_ID);
  const conversation = useMemo(() => messages.filter((message) =>
    (message.senderId === DEMO_EXAMINEE_ID && message.receiverId === DEMO_PROCTOR_ID) ||
    (message.senderId === DEMO_PROCTOR_ID && message.receiverId === DEMO_EXAMINEE_ID)), [messages]);
  const unread = conversation.filter((message) => message.receiverId === DEMO_EXAMINEE_ID && !message.read).length;
  useEffect(() => { if (open && unread) markRead(DEMO_PROCTOR_ID); }, [markRead, open, unread]);
  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <section className="mb-3 w-[min(360px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="Chat with proctor">
          <header className="flex items-center justify-between bg-[#105C2E] px-4 py-3 text-white">
            <div><h2 className="text-sm font-semibold">{DEMO_PROCTOR_NAME}</h2><p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online · Available</p></div>
            <div className="flex items-center gap-1">
              <button onClick={() => setOpen(false)} aria-label="Minimize chat" className="rounded-md p-1.5 hover:bg-white/10"><Minus className="h-4 w-4" /></button>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-md p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
          </header>
          <ChatConversation messages={conversation} viewerId={DEMO_EXAMINEE_ID} receiverRole="proctor" onSend={(message) => send(DEMO_PROCTOR_ID, 'examinee', message)} />
          <p className="border-t border-slate-100 bg-white px-3 py-2 text-center text-[10px] text-slate-400">For technical help and exam procedure questions. The proctor cannot provide exam answers.</p>
        </section>
      )}
      <button onClick={() => setOpen((value) => !value)} className="ml-auto flex items-center gap-2 rounded-full bg-[#105C2E] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#0B4523]" aria-expanded={open}>
        <MessageCircle className="h-4 w-4" /> Chat {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#0B4523]">{unread}</span>}
      </button>
    </div>
  );
}
