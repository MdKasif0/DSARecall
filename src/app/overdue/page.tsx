'use client';

import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  CheckCheck,
  Plus,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
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
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { openAddModal } from '@/lib/events';

interface OverdueItem {
  question: DSAQuestion;
  interval: RevisionInterval;
  scheduledDate: string;
  daysOverdue: number;
}

export default function OverduePage() {
  const { questions, recordsMap, isLoaded, markRevision } = useQuestions();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading overdue items...</p>
      </div>
    );
  }

  // Find all overdue revisions
  const overdueList: OverdueItem[] = [];

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const scheduledDate = q[REVISION_KEYS[interval]];
      const diff = getDaysUntilRevision(scheduledDate);
      if (diff < 0) {
        overdueList.push({
          question: q,
          interval,
          scheduledDate,
          daysOverdue: Math.abs(diff),
        });
      }
    }
  }

  // Sort by oldest scheduled date first (highest days overdue first)
  overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const handleMarkAll = () => {
    overdueList.forEach(({ question, interval }) => {
      markRevision(question.id, interval, true);
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text">Overdue Revisions</h1>
            {overdueList.length > 0 && (
              <span className="rounded-full bg-danger-light px-2 py-0.5 text-xs font-bold text-danger border border-[#FECACA]">
                {overdueList.length} Action Needed
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Checkpoints whose scheduled dates have passed without recorded completion
          </p>
        </div>

        {overdueList.length > 1 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAll}>
            <CheckCheck size={14} className="text-primary" />
            Mark All Completed
          </button>
        )}
      </div>

      {/* Content */}
      {overdueList.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckCircle2 size={44} className="text-primary" />}
            title="No overdue revisions"
            description="Great job staying on top of your spaced repetition schedule! Check your upcoming calendar or add a new question to keep building momentum."
            action={
              <div className="flex items-center gap-2">
                <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                  <Plus size={14} />
                  Add Question
                </button>
                <Link href="/upcoming" className="btn btn-secondary btn-sm no-underline">
                  View Upcoming Timeline
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {overdueList.map(({ question, interval, scheduledDate, daysOverdue }) => (
            <div
              key={`${question.id}_${interval}`}
              className="card border-l-4 border-l-danger p-4 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/questions/${question.id}`}
                    className="font-semibold text-sm text-text hover:text-primary no-underline transition-colors truncate"
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
                  <span className="text-xs font-bold text-danger">
                    {daysOverdue} day{daysOverdue === 1 ? '' : 's'} overdue
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Was scheduled for {formatDateDisplay(scheduledDate)}
                  </span>
                  <span>•</span>
                  <span>Solved {formatDateDisplay(question.dateSolved)}</span>
                  <span>•</span>
                  <StatusBadge status={question.status} />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center self-end">
                <Link
                  href={`/questions/${question.id}`}
                  className="btn btn-ghost btn-sm text-xs"
                >
                  Details
                </Link>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => markRevision(question.id, interval, true)}
                >
                  <CheckCircle2 size={14} />
                  Mark Revised
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
