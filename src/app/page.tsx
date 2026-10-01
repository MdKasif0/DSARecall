'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  AlertCircle,
  Percent,
  Download,
  Calendar,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
  formatTodayLong,
  formatDateDisplay,
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
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import ImportExportModal from '@/components/ImportExportModal';
import { openAddModal } from '@/lib/events';

interface ActionItem {
  question: DSAQuestion;
  interval: RevisionInterval;
  scheduledDate: string;
  diff: number;
}

export default function DashboardPage() {
  const { questions, records, recordsMap, isLoaded, markRevision } = useQuestions();
  const [backupOpen, setBackupOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading dashboard...</p>
      </div>
    );
  }

  // Find due today, overdue, and upcoming revisions
  const dueTodayItems: ActionItem[] = [];
  const overdueItems: ActionItem[] = [];
  const upcomingItems: {
    question: DSAQuestion;
    interval: RevisionInterval;
    date: string;
    diff: number;
  }[] = [];

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const scheduledDate = q[REVISION_KEYS[interval]];
      const diff = getDaysUntilRevision(scheduledDate);

      if (diff === 0) {
        dueTodayItems.push({ question: q, interval, scheduledDate, diff });
      } else if (diff < 0) {
        overdueItems.push({ question: q, interval, scheduledDate, diff });
      } else {
        upcomingItems.push({ question: q, interval, date: scheduledDate, diff });
      }
    }
  }

  // Sort
  overdueItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  upcomingItems.sort((a, b) => a.date.localeCompare(b.date));

  const totalActions = dueTodayItems.length + overdueItems.length;

  // Real derived stats
  const completedCheckpointsCount = records.filter((r) => r.completed).length;
  const totalPossibleCheckpoints = questions.length * 6;
  const completionRate =
    totalPossibleCheckpoints > 0
      ? Math.round((completedCheckpointsCount / totalPossibleCheckpoints) * 100)
      : 0;

  const upcomingSlice = upcomingItems.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Dashboard Header Hierarchy */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
            Your DSA revision
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Stay consistent. Keep concepts fresh.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-2 font-medium">
            <Calendar size={13} className="text-slate-500" />
            <span>{formatTodayLong()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setBackupOpen(true)}
            title="Backup and Export Data"
          >
            <Download size={14} />
            <span className="hide-mobile">Backup / Export</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={15} />
            Add Question
          </button>
        </div>
      </div>

      {/* Compact Real Statistics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard
          label="Total Questions"
          value={questions.length}
          icon={<BookOpen size={17} className="text-secondary" />}
        />
        <StatCard
          label="Due Today"
          value={dueTodayItems.length}
          icon={<CalendarCheck size={17} className="text-[#B45309]" />}
          accent="#B45309"
        />
        <StatCard
          label="Overdue"
          value={overdueItems.length}
          icon={<AlertCircle size={17} className="text-danger" />}
          accent="var(--danger)"
        />
        <StatCard
          label="Upcoming"
          value={upcomingItems.length}
          icon={<Clock size={17} className="text-primary" />}
          accent="var(--primary)"
        />
        <StatCard
          label="Completed Revisions"
          value={`${completedCheckpointsCount} / ${totalPossibleCheckpoints}`}
          icon={<CheckCircle2 size={17} className="text-success" />}
          accent="var(--success)"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={<Percent size={17} className="text-primary" />}
          accent="var(--primary)"
        />
      </div>

      {/* Today's Revisions Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-text">Today&apos;s Revisions</h2>
            {totalActions > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                {totalActions} Actionable
              </span>
            )}
          </div>
          {totalActions > 0 && (
            <Link
              href="/today"
              className="flex items-center gap-1 text-xs font-semibold text-primary no-underline hover:underline"
            >
              Open dedicated view
              <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {totalActions === 0 ? (
          <div className="card">
            <EmptyState
              icon={<CheckCircle2 size={40} className="text-primary" />}
              title="No revisions today"
              description="Your schedule is clear. Enjoy the progress or add another problem to keep building momentum."
              action={
                <div className="flex items-center gap-2">
                  <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                    <Plus size={14} />
                    Add Question
                  </button>
                  <Link href="/upcoming" className="btn btn-secondary btn-sm no-underline">
                    View Upcoming Schedule
                  </Link>
                </div>
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Show Overdue items first */}
            {overdueItems.map(({ question, interval, scheduledDate, diff }) => (
              <div
                key={`${question.id}_${interval}`}
                className="card card-hover border-l-4 border-l-danger px-4 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/questions/${question.id}`}
                        className="text-sm font-semibold text-text hover:text-primary no-underline transition-colors truncate"
                      >
                        {question.questionName}
                      </Link>
                      {question.topic && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[0.6875rem] font-medium text-slate-700">
                          {question.topic}
                        </span>
                      )}
                      <span className="rev-overdue text-xs">
                        <AlertCircle size={11} />
                        {REVISION_LABELS[interval]}
                      </span>
                      <span className="text-xs font-semibold text-danger">
                        {Math.abs(diff)}d overdue
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span>Scheduled {formatDateDisplay(scheduledDate)}</span>
                      <span>•</span>
                      <span>Solved {formatDateDisplay(question.dateSolved)}</span>
                      <span>•</span>
                      <StatusBadge status={question.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => markRevision(question.id, interval, true)}
                    >
                      <CheckCircle2 size={14} />
                      Mark Revised
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Show Due Today items */}
            {dueTodayItems.map(({ question, interval, scheduledDate }) => (
              <div
                key={`${question.id}_${interval}`}
                className="card card-hover border-l-4 border-l-amber-500 px-4 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/questions/${question.id}`}
                        className="text-sm font-semibold text-text hover:text-primary no-underline transition-colors truncate"
                      >
                        {question.questionName}
                      </Link>
                      {question.topic && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[0.6875rem] font-medium text-slate-700">
                          {question.topic}
                        </span>
                      )}
                      <span className="rev-today text-xs">
                        <Clock size={11} />
                        {REVISION_LABELS[interval]}
                      </span>
                      <span className="text-xs font-semibold text-[#B45309]">
                        Due today
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span>Scheduled for today ({formatDateDisplay(scheduledDate)})</span>
                      <span>•</span>
                      <span>Solved {formatDateDisplay(question.dateSolved)}</span>
                      <span>•</span>
                      <StatusBadge status={question.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => markRevision(question.id, interval, true)}
                    >
                      <CheckCircle2 size={14} />
                      Mark Revised
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Revisions Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text">Upcoming Revisions</h2>
          {upcomingItems.length > 0 && (
            <Link
              href="/upcoming"
              className="flex items-center gap-1 text-xs font-semibold text-primary no-underline hover:underline"
            >
              Full schedule ({upcomingItems.length})
              <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {upcomingSlice.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Clock size={36} className="text-text-muted" />}
              title="No upcoming revisions"
              description="Add more solved questions to populate your future revision timeline."
            />
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {upcomingSlice.map(({ question, interval, date, diff }) => (
              <div
                key={`${question.id}_${interval}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/questions/${question.id}`}
                      className="text-sm font-semibold text-text hover:text-primary no-underline truncate"
                    >
                      {question.questionName}
                    </Link>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-slate-700">
                      {REVISION_LABELS[interval]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Scheduled for {formatDateDisplay(date)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {diff === 1 ? 'Tomorrow' : `In ${diff} days`}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => markRevision(question.id, interval, true)}
                    title="Mark revised early"
                  >
                    <CheckCircle2 size={13} />
                    Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Backup & Export Modal */}
      <ImportExportModal
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
      />
    </div>
  );
}
