'use client';

import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Plus,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
  getGreeting,
  formatTodayLong,
  getTodayISO,
  formatDateDisplay,
  isToday,
} from '@/lib/dates';
import {
  REVISION_INTERVALS,
  REVISION_KEYS,
  REVISION_LABELS,
} from '@/lib/types';
import type { DSAQuestion } from '@/lib/types';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { openAddModal } from '@/lib/events';
import Link from 'next/link';

export default function DashboardPage() {
  const { questions, isLoaded } = useQuestions();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  const today = getTodayISO();

  // Compute stats
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

  const completed = questions.filter((q) => q.status === 'Completed').length;

  const upcoming: { question: DSAQuestion; revisionDate: string; label: string }[] = [];
  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      const key = REVISION_KEYS[interval];
      const dateVal = q[key];
      if (dateVal > today) {
        upcoming.push({
          question: q,
          revisionDate: dateVal,
          label: REVISION_LABELS[interval],
        });
      }
    }
  }
  upcoming.sort((a, b) => a.revisionDate.localeCompare(b.revisionDate));
  const upcomingSlice = upcoming.slice(0, 8);

  const upcomingCount = new Set(
    upcoming.map((u) => u.question.id)
  ).size;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-text sm:text-2xl">
          {getGreeting()} 👋
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Keep your DSA concepts fresh with spaced revision.
        </p>
        <p className="mt-0.5 text-xs text-text-muted">{formatTodayLong()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Questions"
          value={questions.length}
          icon={<BookOpen size={18} className="text-secondary" />}
        />
        <StatCard
          label="Due Today"
          value={dueToday.length}
          icon={<CalendarCheck size={18} className="text-warning" />}
          accent="var(--warning)"
        />
        <StatCard
          label="Completed"
          value={completed}
          icon={<CheckCircle2 size={18} className="text-success" />}
          accent="var(--success)"
        />
        <StatCard
          label="Upcoming"
          value={upcomingCount}
          icon={<Clock size={18} className="text-primary" />}
          accent="var(--primary)"
        />
      </div>

      {/* Today's Revisions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">
            Today&apos;s Revisions
          </h2>
          {dueToday.length > 0 && (
            <Link
              href="/revisions"
              className="flex items-center gap-1 text-xs font-medium text-primary no-underline hover:underline"
            >
              View all
              <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {dueToday.length === 0 ? (
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
          <div className="space-y-2">
            {dueToday.map((q) => {
              // Find which revision intervals are due today
              const dueIntervals = REVISION_INTERVALS.filter(
                (interval) => q[REVISION_KEYS[interval]] === today
              );

              return (
                <div key={q.id} className="card card-hover px-4 py-3">
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
        )}
      </section>

      {/* Upcoming Revisions */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-text">
          Upcoming Revisions
        </h2>

        {upcomingSlice.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Inbox size={40} />}
              title="No upcoming revisions"
              description="Add questions to start building your revision schedule."
              action={
                <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                  <Plus size={15} />
                  Add Question
                </button>
              }
            />
          </div>
        ) : (
          <div className="card">
            <div className="divide-y divide-border">
              {upcomingSlice.map((item, idx) => (
                <div
                  key={`${item.question.id}-${item.label}-${idx}`}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text truncate">
                      {item.question.questionName}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {item.label}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isToday(item.revisionDate)
                        ? 'text-primary'
                        : 'text-text-muted'
                    }`}
                  >
                    {formatDateDisplay(item.revisionDate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
