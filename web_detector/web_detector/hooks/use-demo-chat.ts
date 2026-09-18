'use client';

import { markDemoConversationRead, readDemoMessages, sendDemoMessage, subscribeDemoChat } from '@/lib/demo-chat-store';
import type { ChatSenderRole } from '@/types/chat';
import type { ChatMessage } from '@/types/chat';
import { useCallback, useEffect, useState } from 'react';

export function useDemoChat(viewerId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    setMessages(readDemoMessages());
    return subscribeDemoChat(() => setMessages(readDemoMessages()));
  }, []);
  const send = useCallback((receiverId: string, senderRole: ChatSenderRole, message: string, proctoringSessionId?: string) => {
    if (!message.trim()) return;
    sendDemoMessage({ senderId: viewerId, receiverId, senderRole, message, proctoringSessionId });
  }, [viewerId]);
  const markRead = useCallback((otherId: string) => markDemoConversationRead(viewerId, otherId), [viewerId]);
  return { messages, send, markRead };
}
