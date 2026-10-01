import { addDays, format, differenceInCalendarDays } from 'date-fns';
import type { RevisionDates, DSAQuestion, RevisionInterval, RevisionItem, RevisionRecord } from './types';
import { REVISION_INTERVALS, REVISION_KEYS, REVISION_LABELS } from './types';

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
 * Exactly: dateSolved + 3, +7, +15, +30, +60, +120 days.
 * @param dateSolved — YYYY-MM-DD
 */
export function calculateRevisionDates(dateSolved: string): RevisionDates {
  const base = parseLocalDate(dateSolved);
  return {
    revision3: format(addDays(base, 3), 'yyyy-MM-dd'),
    revision7: format(addDays(base, 7), 'yyyy-MM-dd'),
    revision15: format(addDays(base, 15), 'yyyy-MM-dd'),
    revision30: format(addDays(base, 30), 'yyyy-MM-dd'),
    revision60: format(addDays(base, 60), 'yyyy-MM-dd'),
    revision120: format(addDays(base, 120), 'yyyy-MM-dd'),
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
