import { addDays, format, differenceInCalendarDays } from 'date-fns';
import type { RevisionDates, DSAQuestion, RevisionInterval, RevisionItem, RevisionRecord } from './types';
import { REVISION_INTERVALS, REVISION_KEYS, REVISION_LABELS } from './types';
import { getSettings } from './settings';

// ────────────────────────────────────────────────
// Core: local calendar date (YYYY-MM-DD)
// ────────────────────────────────────────────────

/**
 * Get today as a local calendar date string (YYYY-MM-DD).
 * Uses the user's local timezone — never UTC.
 */
export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a local-midnight Date,
 * avoiding timezone offset issues from parseISO/new Date(str).
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ────────────────────────────────────────────────
// Revision date calculation
// ────────────────────────────────────────────────

/**
 * Calculate all six revision dates from a solved date.
 * Defaults to: dateSolved + 3, +7, +15, +30, +60, +120 days, or user's custom intervals.
 * @param dateSolved — YYYY-MM-DD
 * @param customIntervals — optional 6 day offsets [d1, d2, d3, d4, d5, d6]
 */
export function calculateRevisionDates(dateSolved: string, customIntervals?: number[]): RevisionDates {
  const base = parseLocalDate(dateSolved);
  let intervals = customIntervals;
  if (!intervals || intervals.length !== 6) {
    if (typeof window !== 'undefined') {
      try {
        const s = getSettings();
        if (s && Array.isArray(s.intervals) && s.intervals.length === 6) {
          intervals = s.intervals;
        }
      } catch {
        intervals = [3, 7, 15, 30, 60, 120];
      }
    }
  }
  if (!intervals || intervals.length !== 6) {
    intervals = [3, 7, 15, 30, 60, 120];
  }

  return {
    revision3: format(addDays(base, intervals[0]), 'yyyy-MM-dd'),
    revision7: format(addDays(base, intervals[1]), 'yyyy-MM-dd'),
    revision15: format(addDays(base, intervals[2]), 'yyyy-MM-dd'),
    revision30: format(addDays(base, intervals[3]), 'yyyy-MM-dd'),
    revision60: format(addDays(base, intervals[4]), 'yyyy-MM-dd'),
    revision120: format(addDays(base, intervals[5]), 'yyyy-MM-dd'),
  };
}

// ────────────────────────────────────────────────
// Date comparison (always local calendar dates)
// ────────────────────────────────────────────────

/** Check if a YYYY-MM-DD string is today. */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayISO();
}

/** Check if a YYYY-MM-DD string is before today. */
export function isPast(dateStr: string): boolean {
  return dateStr < getTodayISO();
}

/** Check if a YYYY-MM-DD string is after today. */
export function isFuture(dateStr: string): boolean {
  return dateStr > getTodayISO();
}

/**
 * Calendar-day difference: target − reference.
 * Positive = target is in the future relative to reference.
 */
export function daysBetween(reference: string, target: string): number {
  return differenceInCalendarDays(parseLocalDate(target), parseLocalDate(reference));
}

/**
 * Days from today until a given date.
 * Positive = future, 0 = today, negative = past/overdue.
 */
export function getDaysUntilRevision(dateStr: string): number {
  return daysBetween(getTodayISO(), dateStr);
}

// ────────────────────────────────────────────────
// Question-level revision helpers
// ────────────────────────────────────────────────

/**
 * Helper to check if a specific revision checkpoint is completed.
 */
export function isCheckpointCompleted(
  questionId: string,
  interval: RevisionInterval,
  recordsMap?: Map<string, RevisionRecord>
): boolean {
  if (!recordsMap) return false;
  const key = `${questionId}_${interval}`;
  return recordsMap.get(key)?.completed === true;
}

/**
 * Does any uncompleted revision date on this question equal today?
 * If recordsMap is omitted, checks purely by date.
 */
export function isDueToday(
  question: DSAQuestion,
  recordsMap?: Map<string, RevisionRecord>
): boolean {
  const today = getTodayISO();
  return REVISION_INTERVALS.some((i) => {
    if (recordsMap && isCheckpointCompleted(question.id, i, recordsMap)) {
      return false;
    }
    return question[REVISION_KEYS[i]] === today;
  });
}

/**
 * Does any uncompleted revision date on this question fall before today?
 * If recordsMap is omitted, checks purely by date.
 */
export function isOverdue(
  question: DSAQuestion,
  recordsMap?: Map<string, RevisionRecord>
): boolean {
  const today = getTodayISO();
  return REVISION_INTERVALS.some((i) => {
    if (recordsMap && isCheckpointCompleted(question.id, i, recordsMap)) {
      return false;
    }
    return question[REVISION_KEYS[i]] < today;
  });
}

/**
 * Get the next upcoming revision for a question (earliest uncompleted date >= today,
 * or earliest future date).
 * Returns null if all revisions are completed or in the past.
 */
export function getNextRevision(
  question: DSAQuestion,
  recordsMap?: Map<string, RevisionRecord>
): { interval: RevisionInterval; date: string; daysUntil: number } | null {
  const today = getTodayISO();
  for (const interval of REVISION_INTERVALS) {
    if (recordsMap && isCheckpointCompleted(question.id, interval, recordsMap)) {
      continue;
    }
    const d = question[REVISION_KEYS[interval]];
    if (d >= today) {
      return {
        interval,
        date: d,
        daysUntil: getDaysUntilRevision(d),
      };
    }
  }
  return null;
}

/**
 * Get all revision dates for a question, paired with their intervals.
 */
export function getRevisionDates(
  question: DSAQuestion
): { interval: RevisionInterval; date: string; label: string }[] {
  return REVISION_INTERVALS.map((interval) => ({
    interval,
    date: question[REVISION_KEYS[interval]],
    label: REVISION_LABELS[interval],
  }));
}

/**
 * Which intervals on this question are due today and uncompleted?
 */
export function getDueTodayIntervals(
  question: DSAQuestion,
  recordsMap?: Map<string, RevisionRecord>
): RevisionInterval[] {
  const today = getTodayISO();
  return REVISION_INTERVALS.filter((i) => {
    if (recordsMap && isCheckpointCompleted(question.id, i, recordsMap)) {
      return false;
    }
    return question[REVISION_KEYS[i]] === today;
  });
}

/**
 * Which intervals on this question are overdue and uncompleted?
 */
export function getOverdueIntervals(
  question: DSAQuestion,
  recordsMap?: Map<string, RevisionRecord>
): RevisionInterval[] {
  const today = getTodayISO();
  return REVISION_INTERVALS.filter((i) => {
    if (recordsMap && isCheckpointCompleted(question.id, i, recordsMap)) {
      return false;
    }
    return question[REVISION_KEYS[i]] < today;
  });
}

// ────────────────────────────────────────────────
// Formatting
// ────────────────────────────────────────────────

/** "Oct 4, 2026" */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  return format(parseLocalDate(dateStr), 'MMM d, yyyy');
}

/** "Oct 4" */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  return format(parseLocalDate(dateStr), 'MMM d');
}

/** "October 4, 2026" */
export function formatDateLong(dateStr: string): string {
  if (!dateStr) return '';
  return format(parseLocalDate(dateStr), 'MMMM d, yyyy');
}

/** "Wednesday, October 1, 2026" */
export function formatTodayLong(): string {
  return format(new Date(), 'EEEE, MMMM d, yyyy');
}

/**
 * Human-friendly relative label for a date.
 * "Today", "Tomorrow", "Yesterday", "In 3 days", "3 days overdue", or formatted date.
 */
export function formatRelativeDate(dateStr: string): string {
  const diff = getDaysUntilRevision(dateStr);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff <= 14) return `In ${diff} days`;
  if (diff < -1 && diff >= -14) return `${Math.abs(diff)} days overdue`;
  return formatDateDisplay(dateStr);
}

// ────────────────────────────────────────────────
// Misc
// ────────────────────────────────────────────────

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ────────────────────────────────────────────────
// Aggregate helpers used by pages
// ────────────────────────────────────────────────

/**
 * Build a flat list of RevisionItems from questions.
 */
export function buildRevisionItems(
  questions: DSAQuestion[],
  recordsMap: Map<string, RevisionRecord>
): RevisionItem[] {
  const items: RevisionItem[] = [];
  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      const scheduledDate = q[REVISION_KEYS[interval]];
      const recordKey = `${q.id}_${interval}`;
      const record = recordsMap.get(recordKey) ?? null;
      items.push({ question: q, interval, scheduledDate, record });
    }
  }
  return items;
}

/**
 * Group revision items by their scheduled date.
 * Returns entries sorted by date ascending.
 */
export function groupByDate(
  items: RevisionItem[]
): { date: string; items: RevisionItem[] }[] {
  const map = new Map<string, RevisionItem[]>();
  for (const item of items) {
    const arr = map.get(item.scheduledDate) ?? [];
    arr.push(item);
    map.set(item.scheduledDate, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items }));
}

/**
 * Calculate completed revisions / 6 and percentage for a question.
 */
export function getQuestionProgress(
  questionId: string,
  recordsMap: Map<string, RevisionRecord>
): { completedCount: number; total: number; percent: number } {
  let count = 0;
  for (const interval of REVISION_INTERVALS) {
    if (isCheckpointCompleted(questionId, interval, recordsMap)) {
      count++;
    }
  }
  return {
    completedCount: count,
    total: 6,
    percent: Math.round((count / 6) * 100),
  };
}

/**
 * Sort questions according to user selection.
 * Default: Due today first -> Overdue -> Upcoming -> Finished/other.
 */
export function sortQuestions(
  questions: DSAQuestion[],
  sortBy: import('./types').SortOption,
  recordsMap: Map<string, RevisionRecord>
): DSAQuestion[] {
  const copy = [...questions];

  switch (sortBy) {
    case 'name-asc':
      return copy.sort((a, b) => a.questionName.localeCompare(b.questionName));

    case 'name-desc':
      return copy.sort((a, b) => b.questionName.localeCompare(a.questionName));

    case 'date-newest':
      return copy.sort((a, b) => b.dateSolved.localeCompare(a.dateSolved));

    case 'date-oldest':
      return copy.sort((a, b) => a.dateSolved.localeCompare(b.dateSolved));

    case 'status':
      const order = { 'In Progress': 0, Pending: 1, Completed: 2 };
      return copy.sort((a, b) => order[a.status] - order[b.status]);

    case 'next-revision': {
      return copy.sort((a, b) => {
        const nextA = getNextRevision(a, recordsMap);
        const nextB = getNextRevision(b, recordsMap);
        if (nextA && nextB) return nextA.date.localeCompare(nextB.date);
        if (nextA && !nextB) return -1;
        if (!nextA && nextB) return 1;
        return a.questionName.localeCompare(b.questionName);
      });
    }

    case 'default':
    default: {
      return copy.sort((a, b) => {
        const isDueA = isDueToday(a, recordsMap);
        const isDueB = isDueToday(b, recordsMap);
        if (isDueA && !isDueB) return -1;
        if (!isDueA && isDueB) return 1;

        const isOverdueA = isOverdue(a, recordsMap);
        const isOverdueB = isOverdue(b, recordsMap);
        if (isOverdueA && !isOverdueB) return -1;
        if (!isOverdueA && isOverdueB) return 1;

        const nextA = getNextRevision(a, recordsMap);
        const nextB = getNextRevision(b, recordsMap);
        if (nextA && nextB) return nextA.date.localeCompare(nextB.date);
        if (nextA && !nextB) return -1;
        if (!nextA && nextB) return 1;

        return b.dateSolved.localeCompare(a.dateSolved);
      });
    }
  }
}

