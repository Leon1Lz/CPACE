export type ProctoringSeverity = 'low' | 'warning' | 'high';

export type ProctoringEvent = {
  id: string;
  examineeId: string;
  examId: string;
  type: string;
  description: string;
  timestamp: Date;
  severity: ProctoringSeverity;
  duration?: number;
  reviewed: boolean;
};

export type MonitoringStatus = 'normal' | 'warning' | 'high' | 'offline';

export type ExamineeMonitoringStatus = {
  examineeId: string;
  name: string;
  examProgress: number;
  totalQuestions: number;
  monitoringStatus: MonitoringStatus;
  warningCount: number;
  connected: boolean;
  events: ProctoringEvent[];
  reviewed: boolean;
};
