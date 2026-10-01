import type {
  DSAQuestion,
  QuestionStatus,
  QuestionDifficulty,
  QuestionPriority,
  RevisionRecord,
  RevisionInterval,
  TrackerExportData,
} from './types';
import { REVISION_INTERVALS, REVISION_KEYS } from './types';
import {
  calculateRevisionDates,
  generateId,
  getTodayISO,
  isCheckpointCompleted,
} from './dates';

const STORAGE_KEY = 'dsarecall_questions';
const RECORDS_KEY = 'dsarecall_revision_records';

// ────────────────────────────────────────────────
// Questions CRUD
// ────────────────────────────────────────────────

/**
 * Get all questions from localStorage.
 */
export function getQuestions(): DSAQuestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DSAQuestion[];
  } catch {
    return [];
  }
}

/**
 * Save the full questions array to localStorage.
 */
export function saveQuestions(questions: DSAQuestion[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

/**
 * Add a new question. Automatically calculates revision dates.
 */
export function addQuestion(
  questionName: string,
  dateSolved: string,
  status: QuestionStatus = 'Pending',
  topic?: string,
  difficulty?: QuestionDifficulty,
  priority?: QuestionPriority
): DSAQuestion {
  const now = new Date().toISOString();
  const revisions = calculateRevisionDates(dateSolved);

  const question: DSAQuestion = {
    id: generateId(),
    questionName: questionName.trim(),
    topic: topic?.trim() || undefined,
    difficulty,
    priority,
    dateSolved,
    ...revisions,
    status,
    createdAt: now,
    updatedAt: now,
  };

  const questions = getQuestions();
  questions.push(question);
  saveQuestions(questions);

  return question;
}

/**
 * Update an existing question by ID.
 * If dateSolved changes, recalculates all scheduled revision dates and
 * carefully synchronizes existing revision record scheduled dates so old dates
 * do not remain incorrectly attached.
 */
export function updateQuestion(
  id: string,
  updates: Partial<Pick<DSAQuestion, 'questionName' | 'dateSolved' | 'status' | 'topic' | 'difficulty' | 'priority'>>
): DSAQuestion | null {
  const questions = getQuestions();
  const index = questions.findIndex((q) => q.id === id);
  if (index === -1) return null;

  const existing = questions[index];
  const dateChanged = !!updates.dateSolved && updates.dateSolved !== existing.dateSolved;

  if (dateChanged && updates.dateSolved) {
    const newRevisions = calculateRevisionDates(updates.dateSolved);
    Object.assign(existing, newRevisions);

    // Carefully update scheduledDate on existing revision records
    const records = getRevisionRecords();
    let recordsUpdated = false;
    for (const r of records) {
      if (r.questionId === id) {
        const key = REVISION_KEYS[r.interval];
        const newScheduledDate = newRevisions[key];
        if (newScheduledDate && r.scheduledDate !== newScheduledDate) {
          r.scheduledDate = newScheduledDate;
          recordsUpdated = true;
        }
      }
    }
    if (recordsUpdated) {
      saveRevisionRecords(records);
    }
  }

  Object.assign(existing, {
    ...updates,
    questionName: updates.questionName !== undefined ? updates.questionName.trim() : existing.questionName,
    topic: updates.topic !== undefined ? updates.topic?.trim() || undefined : existing.topic,
    updatedAt: new Date().toISOString(),
  });

  questions[index] = existing;
  saveQuestions(questions);

  return existing;
}

/**
 * Delete a question by ID. Also cleans up its revision records.
 */
export function deleteQuestion(id: string): boolean {
  const questions = getQuestions();
  const filtered = questions.filter((q) => q.id !== id);
  if (filtered.length === questions.length) return false;
  saveQuestions(filtered);

  // Clean up associated records
  const records = getRevisionRecords();
  const filteredRecords = records.filter((r) => r.questionId !== id);
  if (filteredRecords.length !== records.length) {
    saveRevisionRecords(filteredRecords);
  }

  return true;
}

/**
 * Get a single question by ID.
 */
export function getQuestionById(id: string): DSAQuestion | null {
  const questions = getQuestions();
  return questions.find((q) => q.id === id) || null;
}

// ────────────────────────────────────────────────
// Revision Records
// ────────────────────────────────────────────────

/**
 * Get all revision records from localStorage.
 */
export function getRevisionRecords(): RevisionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RevisionRecord[];
  } catch {
    return [];
  }
}

/**
 * Save all revision records to localStorage.
 */
export function saveRevisionRecords(records: RevisionRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

/**
 * Return a Map of revision records keyed by `${questionId}_${interval}`.
 */
export function getRevisionRecordsMap(): Map<string, RevisionRecord> {
  const records = getRevisionRecords();
  const map = new Map<string, RevisionRecord>();
  for (const r of records) {
    map.set(`${r.questionId}_${r.interval}`, r);
  }
  return map;
}

/**
 * Mark a revision checkpoint completed or uncompleted.
 * - Scheduled dates stay fixed.
 * - Automatically advances/updates question status:
 *   - All 6 intervals completed -> 'Completed'
 *   - >= 1 interval completed -> 'In Progress' (if previously 'Pending')
 *   - 0 completed -> 'Pending' (if was previously auto-'In Progress')
 */
export function markRevisionCompleted(
  questionId: string,
  interval: RevisionInterval,
  completed: boolean = true
): { question: DSAQuestion | null; record: RevisionRecord } {
  const questions = getQuestions();
  const question = questions.find((q) => q.id === questionId) || null;
  const records = getRevisionRecords();

  const now = new Date().toISOString();
  const existingRecordIndex = records.findIndex(
    (r) => r.questionId === questionId && r.interval === interval
  );

  let record: RevisionRecord;

  if (existingRecordIndex >= 0) {
    record = {
      ...records[existingRecordIndex],
      completed,
      completedAt: completed ? now : null,
    };
    records[existingRecordIndex] = record;
  } else {
    const scheduledDate = question ? question[REVISION_KEYS[interval]] : '';
    record = {
      id: generateId(),
      questionId,
      interval,
      scheduledDate,
      completed,
      completedAt: completed ? now : null,
    };
    records.push(record);
  }

  saveRevisionRecords(records);

  // Auto-update question status if question exists
  if (question) {
    const qRecords = records.filter((r) => r.questionId === questionId && r.completed);
    const completedCount = qRecords.length;

    let newStatus = question.status;
    if (completedCount === REVISION_INTERVALS.length) {
      newStatus = 'Completed';
    } else if (completedCount > 0 && question.status === 'Pending') {
      newStatus = 'In Progress';
    } else if (completedCount === 0 && question.status === 'In Progress') {
      newStatus = 'Pending';
    }

    if (newStatus !== question.status) {
      question.status = newStatus;
      question.updatedAt = now;
      saveQuestions(questions);
    }
  }

  return { question, record };
}

// ────────────────────────────────────────────────
// Derived queries & Stats
// ────────────────────────────────────────────────

export interface DashboardStats {
  total: number;
  dueToday: number;
  overdue: number;
  upcoming: number;
  completed: number;
  completedCheckpoints: number;
  totalCheckpoints: number;
  completionRate: number;
}

/**
 * Get accurate statistics derived directly from stored data.
 */
export function getStats(): DashboardStats {
  const questions = getQuestions();
  const records = getRevisionRecords();
  const recordsMap = getRevisionRecordsMap();
  const today = getTodayISO();

  let dueTodayCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;

  for (const q of questions) {
    let hasDueToday = false;
    let hasOverdue = false;
    let hasUpcoming = false;

    for (const interval of REVISION_INTERVALS) {
      const isDone = isCheckpointCompleted(q.id, interval, recordsMap);
      if (isDone) continue;

      const dateStr = q[REVISION_KEYS[interval]];
      if (dateStr === today) {
        hasDueToday = true;
      } else if (dateStr < today) {
        hasOverdue = true;
      } else if (dateStr > today) {
        hasUpcoming = true;
      }
    }

    if (hasDueToday) dueTodayCount++;
    if (hasOverdue) overdueCount++;
    if (hasUpcoming) upcomingCount++;
  }

  const completedQuestionsCount = questions.filter((q) => q.status === 'Completed').length;
  const completedCheckpointsCount = records.filter((r) => r.completed).length;
  const totalPossibleCheckpoints = questions.length * 6;

  const completionRate =
    totalPossibleCheckpoints > 0
      ? Math.round((completedCheckpointsCount / totalPossibleCheckpoints) * 100)
      : 0;

  return {
    total: questions.length,
    dueToday: dueTodayCount,
    overdue: overdueCount,
    upcoming: upcomingCount,
    completed: completedQuestionsCount,
    completedCheckpoints: completedCheckpointsCount,
    totalCheckpoints: totalPossibleCheckpoints,
    completionRate,
  };
}

// ────────────────────────────────────────────────
// Import / Export
// ────────────────────────────────────────────────

/**
 * Export all tracker data as JSON.
 */
export function exportDataJSON(): TrackerExportData {
  const questions = getQuestions();
  const records = getRevisionRecords();

  return {
    version: '1.0.0',
    appName: 'DSARecall',
    exportedAt: new Date().toISOString(),
    questions,
    records,
  };
}

/**
 * Export questions and revision dates as CSV matching the Excel tracker structure.
 */
export function exportDataCSV(): string {
  const questions = getQuestions();
  const recordsMap = getRevisionRecordsMap();

  const headers = [
    'Question Name',
    'Topic',
    'Date Solved',
    '+3 Days',
    '+7 Days',
    '+15 Days',
    '+30 Days',
    '+60 Days',
    '+120 Days',
    'Status',
    'Completed Revisions',
  ];

  const escapeCSV = (value: string | undefined | null) => {
    if (!value) return '""';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return `"${stringValue}"`;
  };

  const rows = questions.map((q) => {
    let completedCount = 0;
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) completedCount++;
    }

    return [
      escapeCSV(q.questionName),
      escapeCSV(q.topic || 'General'),
      escapeCSV(q.dateSolved),
      escapeCSV(q.revision3),
      escapeCSV(q.revision7),
      escapeCSV(q.revision15),
      escapeCSV(q.revision30),
      escapeCSV(q.revision60),
      escapeCSV(q.revision120),
      escapeCSV(q.status),
      escapeCSV(`${completedCount}/6`),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Validate and import JSON data.
 */
export function importDataJSON(
  data: unknown,
  overwriteExisting: boolean = false
): { success: boolean; error?: string; count?: number } {
  try {
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid JSON file: Expected a JSON object' };
    }

    const payload = data as Partial<TrackerExportData>;
    if (!Array.isArray(payload.questions)) {
      return { success: false, error: 'Invalid data format: Missing questions array' };
    }

    // Validate questions items
    for (let i = 0; i < payload.questions.length; i++) {
      const q = payload.questions[i];
      if (!q.questionName || typeof q.questionName !== 'string') {
        return { success: false, error: `Invalid question at item #${i + 1}: Missing name` };
      }
      if (!q.dateSolved || typeof q.dateSolved !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(q.dateSolved)) {
        return { success: false, error: `Invalid question "${q.questionName}": Invalid dateSolved` };
      }
    }

    const existingQuestions = overwriteExisting ? [] : getQuestions();
    const existingRecords = overwriteExisting ? [] : getRevisionRecords();

    // Map existing to avoid duplicates by ID
    const questionsMap = new Map<string, DSAQuestion>();
    for (const q of existingQuestions) questionsMap.set(q.id, q);

    for (const q of payload.questions) {
      // Ensure revision dates are present/calculated
      const revisions = calculateRevisionDates(q.dateSolved);
      const cleanQ: DSAQuestion = {
        ...q,
        id: q.id || generateId(),
        questionName: q.questionName.trim(),
        topic: q.topic?.trim() || undefined,
        ...revisions,
        status: q.status || 'Pending',
        createdAt: q.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      questionsMap.set(cleanQ.id, cleanQ);
    }

    // Merge or set records
    const recordsMap = new Map<string, RevisionRecord>();
    for (const r of existingRecords) recordsMap.set(`${r.questionId}_${r.interval}`, r);

    if (Array.isArray(payload.records)) {
      for (const r of payload.records) {
        if (r.questionId && r.interval) {
          recordsMap.set(`${r.questionId}_${r.interval}`, {
            id: r.id || generateId(),
            questionId: r.questionId,
            interval: r.interval,
            scheduledDate: r.scheduledDate || '',
            completed: !!r.completed,
            completedAt: r.completedAt || null,
          });
        }
      }
    }

    const mergedQuestions = Array.from(questionsMap.values());
    const mergedRecords = Array.from(recordsMap.values());

    saveQuestions(mergedQuestions);
    saveRevisionRecords(mergedRecords);

    return { success: true, count: payload.questions.length };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown import error' };
  }
}
