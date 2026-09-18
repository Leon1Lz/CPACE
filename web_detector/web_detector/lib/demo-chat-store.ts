'use client';

import type { ChatMessage, ChatSenderRole } from '@/types/chat';

export const DEMO_EXAM_ID = 'cert-csp-2026';
export const DEMO_SESSION_ID = 'session-demo-001';
export const DEMO_EXAMINEE_ID = 'examinee-demo-001';
export const DEMO_PROCTOR_ID = 'proctor-demo-001';
export const DEMO_PROCTOR_NAME = 'Dr. Alex Rivera';

const STORAGE_KEY = 'certifica-demo-chat-v1';
const CHANGE_EVENT = 'certifica-demo-chat-change';
const initialMessages: ChatMessage[] = [
  {
    id: 'chat-welcome-001', examId: DEMO_EXAM_ID, proctoringSessionId: DEMO_SESSION_ID,
    senderId: DEMO_PROCTOR_ID, receiverId: DEMO_EXAMINEE_ID, senderRole: 'proctor',
    message: 'Good luck on your exam. Let me know if you experience any technical problems.',
    timestamp: '2026-08-31T09:30:00.000Z', read: true,
  },
  {
    id: 'chat-john-001', examId: DEMO_EXAM_ID, proctoringSessionId: 'session-demo-002',
    senderId: 'EX-002', receiverId: DEMO_PROCTOR_ID, senderRole: 'examinee',
    message: 'Sir, I have a technical problem.', timestamp: '2026-08-31T09:42:00.000Z', read: false,
  },
  {
    id: 'chat-maria-001', examId: DEMO_EXAM_ID, proctoringSessionId: 'session-demo-003',
    senderId: DEMO_PROCTOR_ID, receiverId: 'EX-003', senderRole: 'proctor',
    message: 'Your camera connection is stable now.', timestamp: '2026-08-31T09:38:00.000Z', read: true,
  },
  {
    id: 'chat-maria-002', examId: DEMO_EXAM_ID, proctoringSessionId: 'session-demo-003',
    senderId: 'EX-003', receiverId: DEMO_PROCTOR_ID, senderRole: 'examinee',
    message: 'Thank you.', timestamp: '2026-08-31T09:39:00.000Z', read: true,
  },
];

export function readDemoMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return initialMessages;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ChatMessage[]) : initialMessages;
  } catch {
    return initialMessages;
  }
}

function write(messages: ChatMessage[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function sendDemoMessage(input: {
  senderId: string; receiverId: string; senderRole: ChatSenderRole; message: string;
  proctoringSessionId?: string;
}) {
  const next: ChatMessage = {
    id: crypto.randomUUID(), examId: DEMO_EXAM_ID,
    proctoringSessionId: input.proctoringSessionId ?? DEMO_SESSION_ID,
    senderId: input.senderId, receiverId: input.receiverId, senderRole: input.senderRole,
    message: input.message.trim(), timestamp: new Date().toISOString(), read: false,
  };
  write([...readDemoMessages(), next]);
}

export function markDemoConversationRead(viewerId: string, otherId: string) {
  const current = readDemoMessages();
  let changed = false;
  const next = current.map((message) => {
    if (message.receiverId === viewerId && message.senderId === otherId && !message.read) {
      changed = true;
      return { ...message, read: true };
    }
    return message;
  });
  if (changed) write(next);
}

export function subscribeDemoChat(listener: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) listener(); };
  window.addEventListener('storage', storage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', storage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}
