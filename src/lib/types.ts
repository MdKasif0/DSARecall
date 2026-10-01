export type QuestionStatus = 'Pending' | 'In Progress' | 'Completed';

export interface RevisionDates {
  revision3: string;   // ISO date strings (YYYY-MM-DD)
  revision7: string;
  revision15: string;
  revision30: string;
  revision60: string;
  revision120: string;
}

export interface DSAQuestion {
  id: string;
  questionName: string;
  dateSolved: string;  // ISO date string (YYYY-MM-DD)
  revision3: string;
  revision7: string;
  revision15: string;
  revision30: string;
  revision60: string;
  revision120: string;
  status: QuestionStatus;
  createdAt: string;   // ISO datetime string
  updatedAt: string;   // ISO datetime string
}

export const REVISION_INTERVALS = [3, 7, 15, 30, 60, 120] as const;
export type RevisionInterval = (typeof REVISION_INTERVALS)[number];

export const REVISION_LABELS: Record<RevisionInterval, string> = {
  3: '+3 Days',
  7: '+7 Days',
  15: '+15 Days',
  30: '+30 Days',
  60: '+60 Days',
  120: '+120 Days',
};

export const REVISION_KEYS: Record<RevisionInterval, keyof RevisionDates> = {
  3: 'revision3',
  7: 'revision7',
  15: 'revision15',
  30: 'revision30',
  60: 'revision60',
  120: 'revision120',
};

export const STATUS_OPTIONS: QuestionStatus[] = ['Pending', 'In Progress', 'Completed'];
