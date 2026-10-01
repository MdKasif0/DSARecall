'use client';

import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  Plus,
  ArrowRight,
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
import EmptyState from '@/components/EmptyState';
import TopBar from '@/components/TopBar';
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

  // Sort by highest days overdue first
  overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const handleMarkAll = () => {
    overdueList.forEach(({ question, interval }) => {
      markRevision(question.id, interval, true);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Breadcrumb and Profile */}
      <TopBar />

      {/* Header matching Section 21 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Overdue Revisions
            </h1>
            {overdueList.length > 0 && (
              <span className="rounded-full bg-[#F4E4DF] px-2.5 py-0.5 text-xs font-bold text-[#A65D50] border border-[#E6D0CA]">
                {overdueList.length}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Revisions that still need to be completed.
          </p>
        </div>

        {overdueList.length > 1 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAll}>
            <CheckCheck size={14} className="text-[#8B6F47]" />
            <span>Mark All Completed</span>
          </button>
        )}
      </div>

      {/* Content */}
      {overdueList.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckCircle2 size={44} className="text-[#6F8064]" />}
            title="Perfectly clear."
            description="You have no overdue revisions. All your spaced intervals are completely up to date."
            action={
              <div className="flex items-center gap-2">
                <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                  <Plus size={14} />
                  <span>Add Question</span>
                </button>
                <Link href="/upcoming" className="btn btn-secondary btn-sm no-underline">
                  <span>View Upcoming Schedule</span>
                  <ArrowRight size={13} />
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
              className="card border-l-4 border-l-[#A65D50] p-4 hover:border-[#D5CCBF] transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/questions/${question.id}`}
                    className="font-bold text-base text-text hover:text-[#8B6F47] no-underline truncate"
                  >
                    {question.questionName}
                  </Link>
                  {question.topic && (
                    <span className="rounded bg-[#F2ECE2] px-2 py-0.5 text-[0.6875rem] font-medium text-[#71695F] border border-[#E4DDD2]">
                      {question.topic}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold bg-[#F4E4DF] text-[#925A4D] border border-[#E6D0CA]">
                    <AlertCircle size={11} />
                    {REVISION_LABELS[interval]}
                  </span>
                  <span className="text-xs font-bold text-[#A65D50]">
                    {daysOverdue} day{daysOverdue === 1 ? '' : 's'} overdue
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-text-secondary">
                  <span>Original due date: <strong className="text-text font-semibold">{formatDateDisplay(scheduledDate)}</strong></span>
                  <span>•</span>
                  <span>Originally solved {formatDateDisplay(question.dateSolved)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => markRevision(question.id, interval, true)}
                >
                  <CheckCircle2 size={14} />
                  <span>Mark Revised</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
