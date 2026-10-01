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
  topic?: string;      // Optional category / topic
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

/**
 * Tracks completion of individual revision checkpoints.
 * Scheduled dates stay fixed; only completion state changes.
 */
export interface RevisionRecord {
  id: string;
  questionId: string;
  interval: RevisionInterval;
  scheduledDate: string;   // YYYY-MM-DD, derived from dateSolved
  completed: boolean;
  completedAt: string | null;  // ISO datetime string or null
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

export const COMMON_TOPICS = [
  'Arrays',
  'Strings',
  'Two Pointers',
  'Sliding Window',
  'Linked List',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Binary Search',
  'Heap / Priority Queue',
  'Stack / Queue',
  'Backtracking',
  'Greedy',
  'Matrix',
  'Bit Manipulation',
  'Other',
] as const;

export type CommonTopic = (typeof COMMON_TOPICS)[number];

/**
 * Represents a single revision item with its question context,
 * used for listing due/overdue/upcoming items.
 */
export interface RevisionItem {
  question: DSAQuestion;
  interval: RevisionInterval;
  scheduledDate: string;
  record: RevisionRecord | null;
}

/**
 * Schema for Export / Import of data.
 */
export interface TrackerExportData {
  version: string;
  exportedAt: string;
  appName: string;
  questions: DSAQuestion[];
  records: RevisionRecord[];
}

export type SortOption =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'date-newest'
  | 'date-oldest'
  | 'next-revision'
  | 'status';
