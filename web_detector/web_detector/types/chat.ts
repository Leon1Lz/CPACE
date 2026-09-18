export type ChatSenderRole = 'examinee' | 'proctor' | 'instructor';

export type ChatMessage = {
  id: string;
  examId: string;
  proctoringSessionId: string;
  senderId: string;
  receiverId: string;
  senderRole: ChatSenderRole;
  message: string;
  timestamp: string;
  read: boolean;
};

export type ChatParticipant = {
  id: string;
  name: string;
  role: ChatSenderRole;
  online: boolean;
  examStatus?: string;
};
