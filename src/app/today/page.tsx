'use client';

import Link from 'next/link';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
  getTodayISO,
  formatDateDisplay,
  formatTodayLong,
  getDaysUntilRevision,
  isCheckpointCompleted,
} from '@/lib/dates';
import {
  REVISION_INTERVALS,
  REVISION_KEYS,
  REVISION_LABELS,
  type RevisionInterval,
  type DSAQuestion,
} from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { openAddModal } from '@/lib/events';

interface RevisionActionItem {
  question: DSAQuestion;
  interval: RevisionInterval;
  scheduledDate: string;
  daysUntil: number;
}

export default function TodayPage() {
  const { questions, records, recordsMap, isLoaded, markRevision } = useQuestions();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  const today = getTodayISO();

  // Find uncompleted items due today and overdue
  const dueTodayItems: RevisionActionItem[] = [];
  const overdueItems: RevisionActionItem[] = [];

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const scheduledDate = q[REVISION_KEYS[interval]];
      const diff = getDaysUntilRevision(scheduledDate);

      if (diff === 0) {
        dueTodayItems.push({ question: q, interval, scheduledDate, daysUntil: diff });
      } else if (diff < 0) {
        overdueItems.push({ question: q, interval, scheduledDate, daysUntil: diff });
      }
    }
  }

  // Sort overdue items by oldest scheduled date first
  overdueItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  // Find items completed today
  const completedTodayRecords = records.filter((r) => {
    if (!r.completed || !r.completedAt) return false;
    return r.completedAt.startsWith(today);
  });

  const totalActionItems = dueTodayItems.length + overdueItems.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Today&apos;s Revisions</h1>
          <p className="text-sm text-text-muted">{formatTodayLong()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/revisions" className="btn btn-secondary btn-sm no-underline">
            View Upcoming
            <ArrowRight size={14} />
          </Link>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={15} />
            Add Question
          </button>
        </div>
      </div>

      {/* Overview Metric Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
          <span className="text-text-muted">Due Today:</span>
          <span className="font-semibold text-text">{dueTodayItems.length}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
          <span className="text-text-muted">Overdue:</span>
          <span
            className={`font-semibold ${
              overdueItems.length > 0 ? 'text-danger' : 'text-text'
            }`}
          >
            {overdueItems.length}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
          <span className="text-text-muted">Completed Today:</span>
          <span className="font-semibold text-primary">
            {completedTodayRecords.length}
          </span>
        </div>
      </div>

      {totalActionItems === 0 && completedTodayRecords.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckCircle2 size={44} className="text-primary" />}
            title="All caught up for today!"
            description="You don't have any pending revisions due today or overdue. Keep solving new problems or check your upcoming schedule."
            action={
              <div className="flex items-center gap-2">
                <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                  <Plus size={15} />
                  Add Question
                </button>
                <Link href="/revisions" className="btn btn-secondary btn-sm no-underline">
                  View Upcoming Schedule
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* Overdue Section */}
          {overdueItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-danger-light text-danger">
                    <AlertCircle size={13} />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-danger">
                    Overdue Revisions · {overdueItems.length}
                  </h2>
                </div>
                <span className="text-xs text-text-muted">Action recommended</span>
              </div>

              <div className="space-y-2">
                {overdueItems.map(({ question, interval, scheduledDate, daysUntil }) => (
                  <div
                    key={`${question.id}_${interval}`}
                    className="card border-l-4 border-l-danger p-4 transition-all hover:border-slate-300"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/questions/${question.id}`}
                            className="font-semibold text-text hover:text-primary no-underline transition-colors"
                          >
                            {question.questionName}
                          </Link>
                          <span className="rev-overdue text-xs">
                            {REVISION_LABELS[interval]}
                          </span>
                          <span className="text-xs font-semibold text-danger">
                            {Math.abs(daysUntil)} day{Math.abs(daysUntil) === 1 ? '' : 's'}{' '}
                            overdue
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          <span>
                            Scheduled for {formatDateDisplay(scheduledDate)}
                          </span>
                          <span>•</span>
                          <span>Solved {formatDateDisplay(question.dateSolved)}</span>
                          <span>•</span>
                          <StatusBadge status={question.status} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => markRevision(question.id, interval, true)}
                        >
                          <CheckCircle2 size={15} />
                          Mark Revised
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Due Today Section */}
          {dueTodayItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B45309]">
                    <CalendarCheck size={13} />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-text">
                    Due Today · {dueTodayItems.length}
                  </h2>
                </div>
                <span className="text-xs text-text-muted">Scheduled for today</span>
              </div>

              <div className="space-y-2">
                {dueTodayItems.map(({ question, interval, scheduledDate }) => (
                  <div
                    key={`${question.id}_${interval}`}
                    className="card border-l-4 border-l-amber-500 p-4 transition-all hover:border-slate-300"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/questions/${question.id}`}
                            className="font-semibold text-text hover:text-primary no-underline transition-colors"
                          >
                            {question.questionName}
                          </Link>
                          <span className="rev-today text-xs">
                            {REVISION_LABELS[interval]}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          <span>
                            Scheduled for today ({formatDateDisplay(scheduledDate)})
                          </span>
                          <span>•</span>
                          <span>Solved {formatDateDisplay(question.dateSolved)}</span>
                          <span>•</span>
                          <StatusBadge status={question.status} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => markRevision(question.id, interval, true)}
                        >
                          <CheckCircle2 size={15} />
                          Mark Revised
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed Today Section */}
          {completedTodayRecords.length > 0 && (
            <section className="space-y-3 pt-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                Completed Today · {completedTodayRecords.length}
              </h2>
              <div className="space-y-2">
                {completedTodayRecords.map((rec) => {
                  const q = questions.find((item) => item.id === rec.questionId);
                  if (!q) return null;
                  return (
                    <div
                      key={rec.id}
                      className="card bg-slate-50/50 p-3.5 border-border flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/questions/${q.id}`}
                            className="text-sm font-medium text-text hover:text-primary no-underline"
                          >
                            {q.questionName}
                          </Link>
                          <span className="rev-completed text-xs">
                            {REVISION_LABELS[rec.interval]} Done
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted">
                          Scheduled: {formatDateDisplay(rec.scheduledDate)}
                        </p>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm text-text-muted hover:text-danger"
                        title="Unmark completed"
                        onClick={() => markRevision(rec.questionId, rec.interval, false)}
                      >
                        <RotateCcw size={13} />
                        Undo
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
