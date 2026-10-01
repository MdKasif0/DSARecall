import { addDays, parseISO, format, startOfDay } from 'date-fns';
import type { RevisionDates } from './types';

/**
 * Calculate all six revision dates from a solved date.
 * Uses date-fns for timezone-safe date arithmetic.
 *
 * @param dateSolved - ISO date string (YYYY-MM-DD)
 * @returns Object with all six revision date strings (YYYY-MM-DD)
 */
export function calculateRevisionDates(dateSolved: string): RevisionDates {
  const base = parseISO(dateSolved);

  return {
    revision3: format(addDays(base, 3), 'yyyy-MM-dd'),
    revision7: format(addDays(base, 7), 'yyyy-MM-dd'),
    revision15: format(addDays(base, 15), 'yyyy-MM-dd'),
    revision30: format(addDays(base, 30), 'yyyy-MM-dd'),
    revision60: format(addDays(base, 60), 'yyyy-MM-dd'),
    revision120: format(addDays(base, 120), 'yyyy-MM-dd'),
  };
}

/**
 * Get today's date as an ISO string (YYYY-MM-DD), timezone-safe.
 */
export function getTodayISO(): string {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
}

/**
 * Format a date string (YYYY-MM-DD) into a human-readable format.
 * Example: "Oct 4, 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

/**
 * Format a date string into a shorter display.
 * Example: "Oct 4"
 */
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

/**
 * Check if a given date string is today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayISO();
}

/**
 * Check if a given date string is in the past (before today).
 */
export function isPast(dateStr: string): boolean {
  return dateStr < getTodayISO();
}

/**
 * Check if a given date string is in the future (after today).
 */
export function isFuture(dateStr: string): boolean {
  return dateStr > getTodayISO();
}

/**
 * Get the number of days between two date strings.
 */
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = parseISO(dateStr1);
  const d2 = parseISO(dateStr2);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get a greeting based on the current hour.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format today's date in a long human-readable format.
 * Example: "Wednesday, October 1, 2026"
 */
export function formatTodayLong(): string {
  return format(new Date(), 'EEEE, MMMM d, yyyy');
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
