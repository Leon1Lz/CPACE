export type ExamQuestionData = {
  id: string;
  prompt: string;
  options: string[];
};

export const examData = {
  id: 'cert-csp-2026', // Replace with an exam ID from your exam service.
  title: 'Certified Security Professional',
  code: 'CSP-204',
  examinee: 'Jordan Lee', // Replace with authenticated examinee profile data.
  durationSeconds: 45 * 60,
  questions: [
    { id: 'q1', prompt: 'Which principle limits user access to only the resources required to perform assigned duties?', options: ['Defense in depth', 'Least privilege', 'Separation of duties', 'Zero trust'] },
    { id: 'q2', prompt: 'What is the primary purpose of a cryptographic hash function?', options: ['Encrypting traffic', 'Verifying data integrity', 'Managing access roles', 'Hiding network addresses'] },
    { id: 'q3', prompt: 'Which response phase should occur immediately after a security incident has been contained?', options: ['Preparation', 'Eradication', 'Identification', 'Lessons learned'] },
    { id: 'q4', prompt: 'A system remains operational when a single server fails. Which security objective does this best support?', options: ['Confidentiality', 'Integrity', 'Availability', 'Non-repudiation'] },
    { id: 'q5', prompt: 'Which control most directly reduces the risk of compromised passwords being used remotely?', options: ['Multi-factor authentication', 'Data classification', 'Network segmentation', 'Log retention'] },
  ] satisfies ExamQuestionData[],
};
