import type { DSAQuestion, QuestionStatus, RevisionRecord, RevisionInterval } from './types';
import { REVISION_INTERVALS, REVISION_KEYS } from './types';
import { calculateRevisionDates, generateId, getTodayISO, isCheckpointCompleted } from './dates';

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
  status: QuestionStatus = 'Pending'
): DSAQuestion {
  const now = new Date().toISOString();
  const revisions = calculateRevisionDates(dateSolved);

  const question: DSAQuestion = {
    id: generateId(),
    questionName,
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
 * If dateSolved changes, recalculates scheduled dates and updates scheduledDate on records.
 */
export function updateQuestion(
  id: string,
  updates: Partial<Pick<DSAQuestion, 'questionName' | 'dateSolved' | 'status'>>
): DSAQuestion | null {
  const questions = getQuestions();
  const index = questions.findIndex((q) => q.id === id);
  if (index === -1) return null;

  const existing = questions[index];

  // If dateSolved changed, recalculate revisions
  if (updates.dateSolved && updates.dateSolved !== existing.dateSolved) {
    const revisions = calculateRevisionDates(updates.dateSolved);
    Object.assign(existing, revisions);

    // Also update scheduledDate on existing revision records
    const records = getRevisionRecords();
    let recordsUpdated = false;
    for (const r of records) {
      if (r.questionId === id) {
        const newDate = revisions[REVISION_KEYS[r.interval]];
        if (newDate) {
          r.scheduledDate = newDate;
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

/**
 * Get statistics about the question set taking revision completions into account.
 */
export function getStats(): {
  total: number;
  dueToday: number;
  overdue: number;
  completed: number;
  upcoming: number;
} {
  const questions = getQuestions();
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

  return {
    total: questions.length,
    dueToday: dueTodayCount,
    overdue: overdueCount,
    completed: completedQuestionsCount,
    upcoming: upcomingCount,
  };
}
