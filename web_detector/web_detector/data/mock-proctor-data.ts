import type {
  ExamineeMonitoringStatus,
  ProctoringEvent,
  ProctoringSeverity,
} from '@/types/proctoring';

// Fixed demo anchor keeps server-rendered and browser-hydrated output identical.
// Replace these mock timestamps with API-provided ISO values in production.
const demoAnchor = Date.parse('2026-08-31T09:45:00.000Z');
const event = (
  id: string,
  examineeId: string,
  type: string,
  severity: ProctoringSeverity,
  minutesAgo: number,
  description: string,
  duration?: number,
): ProctoringEvent => ({
  id,
  examineeId,
  examId: 'cert-csp-2026',
  type,
  severity,
  description,
  timestamp: new Date(demoAnchor - minutesAgo * 60_000),
  duration,
  reviewed: false,
});

const histories: Record<string, ProctoringEvent[]> = {
  'EX-001': [],
  'EX-002': [
    event(
      'e-21',
      'EX-002',
      'Looking Away',
      'warning',
      2,
      'Attention was directed away from the screen.',
      4,
    ),
    event(
      'e-22',
      'EX-002',
      'Looking Right',
      'warning',
      11,
      'Sustained head position indicated attention to the right.',
      3,
    ),
  ],
  'EX-003': [
    event(
      'e-31',
      'EX-003',
      'Multiple Faces Detected',
      'high',
      1,
      'More than one face was visible in the camera frame.',
      6,
    ),
    event(
      'e-32',
      'EX-003',
      'Exam Page Lost Focus',
      'warning',
      15,
      'Exam page became hidden.',
      2,
    ),
  ],
  'EX-004': [
    event(
      'e-41',
      'EX-004',
      'No Face Detected',
      'high',
      4,
      'Face was not visible for several seconds.',
      5,
    ),
    event(
      'e-42',
      'EX-004',
      'Large Posture Change',
      'warning',
      18,
      'A large change in position was observed.',
      4,
    ),
  ],
  'EX-005': [
    event(
      'e-51',
      'EX-005',
      'Exam Page Lost Focus',
      'warning',
      3,
      'Exam window lost focus.',
    ),
    event(
      'e-52',
      'EX-005',
      'Exam Page Lost Focus',
      'warning',
      20,
      'Exam page became hidden.',
    ),
  ],
  'EX-006': [],
};

export const mockExaminees: ExamineeMonitoringStatus[] = [
  {
    examineeId: 'EX-001',
    name: 'Avery Morgan',
    examProgress: 18,
    totalQuestions: 50,
    monitoringStatus: 'normal',
    warningCount: 0,
    connected: true,
    events: histories['EX-001'],
    reviewed: false,
  },
  {
    examineeId: 'EX-002',
    name: 'John Doe',
    examProgress: 15,
    totalQuestions: 50,
    monitoringStatus: 'warning',
    warningCount: 2,
    connected: true,
    events: histories['EX-002'],
    reviewed: false,
  },
  {
    examineeId: 'EX-003',
    name: 'Maria Santos',
    examProgress: 21,
    totalQuestions: 50,
    monitoringStatus: 'high',
    warningCount: 2,
    connected: true,
    events: histories['EX-003'],
    reviewed: false,
  },
  {
    examineeId: 'EX-004',
    name: 'James Cruz',
    examProgress: 12,
    totalQuestions: 50,
    monitoringStatus: 'high',
    warningCount: 2,
    connected: true,
    events: histories['EX-004'],
    reviewed: false,
  },
  {
    examineeId: 'EX-005',
    name: 'Noah Williams',
    examProgress: 28,
    totalQuestions: 50,
    monitoringStatus: 'warning',
    warningCount: 2,
    connected: true,
    events: histories['EX-005'],
    reviewed: false,
  },
  {
    examineeId: 'EX-006',
    name: 'Sofia Chen',
    examProgress: 31,
    totalQuestions: 50,
    monitoringStatus: 'normal',
    warningCount: 0,
    connected: true,
    events: histories['EX-006'],
    reviewed: false,
  },
];

export const mockEvents = mockExaminees
  .flatMap((item) => item.events)
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
