'use client';

import { CheckCircle2, Plus } from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
  getTodayISO,
  formatDateDisplay,
  formatTodayLong,
} from '@/lib/dates';
import {
  REVISION_INTERVALS,
  REVISION_KEYS,
  REVISION_LABELS,
} from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { openAddModal } from '@/lib/events';

export default function RevisionsPage() {
  const { questions, isLoaded } = useQuestions();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

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
  });

  // Also find overdue (past revision dates)
  const overdue = questions.filter((q) => {
    const hasPast = REVISION_INTERVALS.some((interval) => {
      return q[REVISION_KEYS[interval]] < today;
    });
    // Only include if not already in dueToday
    const isDueToday = REVISION_INTERVALS.some(
      (interval) => q[REVISION_KEYS[interval]] === today
    );
    return hasPast && !isDueToday;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text">Today&apos;s Revisions</h1>
        <p className="text-sm text-text-muted">{formatTodayLong()}</p>
      </div>

      {/* Due Today */}
      {dueToday.length === 0 && overdue.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckCircle2 size={40} />}
            title="No revisions due today"
            description="You're all caught up. Add more DSA questions to build your revision schedule."
            action={
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                <Plus size={15} />
                Add Question
              </button>
            }
          />
        </div>
      ) : (
        <>
          {dueToday.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Due Today · {dueToday.length}
              </h2>
              <div className="space-y-2">
                {dueToday.map((q) => {
                  const dueIntervals = REVISION_INTERVALS.filter(
                    (interval) => q[REVISION_KEYS[interval]] === today
                  );
                  return (
                    <div key={q.id} className="card px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text truncate">
                            {q.questionName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {dueIntervals.map((interval) => (
                              <span
                                key={interval}
                                className="rev-today text-xs"
                              >
                                {REVISION_LABELS[interval]}
                              </span>
                            ))}
                            <span className="text-xs text-text-muted">
                              · Solved {formatDateDisplay(q.dateSolved)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={q.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {overdue.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Missed Revisions · {overdue.length}
              </h2>
              <div className="space-y-2">
                {overdue.slice(0, 10).map((q) => {
                  const missedIntervals = REVISION_INTERVALS.filter(
                    (interval) => q[REVISION_KEYS[interval]] < today
                  );
                  return (
                    <div key={q.id} className="card px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text truncate">
                            {q.questionName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {missedIntervals.map((interval) => (
                              <span
                                key={interval}
                                className="rev-overdue text-xs"
                              >
                                {REVISION_LABELS[interval]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <StatusBadge status={q.status} />
                      </div>
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
