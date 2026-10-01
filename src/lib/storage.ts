import type { DSAQuestion, QuestionStatus } from './types';
import { calculateRevisionDates, generateId, getTodayISO } from './dates';

const STORAGE_KEY = 'dsarecall_questions';

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
 * Delete a question by ID.
 */
export function deleteQuestion(id: string): boolean {
  const questions = getQuestions();
  const filtered = questions.filter((q) => q.id !== id);
  if (filtered.length === questions.length) return false;
  saveQuestions(filtered);
  return true;
}

/**
 * Get a single question by ID.
 */
export function getQuestionById(id: string): DSAQuestion | null {
  const questions = getQuestions();
  return questions.find((q) => q.id === id) || null;
}

/**
 * Get questions that are due for revision today.
 * A question is "due today" if any of its revision dates match today's date.
 */
export function getDueToday(): DSAQuestion[] {
  const today = getTodayISO();
  const questions = getQuestions();
  return questions.filter((q) => {
    return (
      q.revision3 === today ||
      q.revision7 === today ||
      q.revision15 === today ||
      q.revision30 === today ||
      q.revision60 === today ||
      q.revision120 === today
    );
  });
}

/**
 * Get questions with upcoming revisions (next 7 days, excluding today).
 */
export function getUpcoming(days: number = 7): { question: DSAQuestion; revisionDate: string; label: string }[] {
  const today = getTodayISO();
  const questions = getQuestions();

  const revisionFields = [
    { key: 'revision3' as const, label: '+3 Days' },
    { key: 'revision7' as const, label: '+7 Days' },
    { key: 'revision15' as const, label: '+15 Days' },
    { key: 'revision30' as const, label: '+30 Days' },
    { key: 'revision60' as const, label: '+60 Days' },
    { key: 'revision120' as const, label: '+120 Days' },
  ];

  const upcoming: { question: DSAQuestion; revisionDate: string; label: string }[] = [];

  for (const q of questions) {
    for (const field of revisionFields) {
      const dateVal = q[field.key];
      if (dateVal > today) {
        upcoming.push({
          question: q,
          revisionDate: dateVal,
          label: field.label,
        });
      }
    }
  }

  // Sort by date ascending
  upcoming.sort((a, b) => a.revisionDate.localeCompare(b.revisionDate));

  // Limit to the specified number of upcoming days
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + days);
  const limitStr = limitDate.toISOString().split('T')[0];

  return upcoming.filter((item) => item.revisionDate <= limitStr);
}

/**
 * Get statistics about the question set.
 */
export function getStats(): {
  total: number;
  dueToday: number;
  completed: number;
  upcoming: number;
} {
  const questions = getQuestions();
  const today = getTodayISO();

  const dueToday = questions.filter((q) => {
    return (
      q.revision3 === today ||
      q.revision7 === today ||
      q.revision15 === today ||
      q.revision30 === today ||
      q.revision60 === today ||
      q.revision120 === today
    );
  }).length;

  const completed = questions.filter((q) => q.status === 'Completed').length;

  // Upcoming = questions with at least one future revision date
  const upcoming = questions.filter((q) => {
    return (
      q.revision3 > today ||
      q.revision7 > today ||
      q.revision15 > today ||
      q.revision30 > today ||
      q.revision60 > today ||
      q.revision120 > today
    );
  }).length;

  return {
    total: questions.length,
    dueToday,
    completed,
    upcoming,
  };
}
