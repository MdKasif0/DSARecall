'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
  formatDateDisplay,
  formatDateLong,
  getTodayISO,
  getDaysUntilRevision,
  isCheckpointCompleted,
} from '@/lib/dates';
import {
  REVISION_INTERVALS,
  REVISION_KEYS,
  REVISION_LABELS,
  STATUS_OPTIONS,
  type QuestionStatus,
  type RevisionInterval,
} from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { openEditModal } from '@/lib/events';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { questions, records, recordsMap, isLoaded, markRevision, updateQuestion, deleteQuestion } =
    useQuestions();

  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading question details...</p>
      </div>
    );
  }

  const question = questions.find((q) => q.id === id);

  if (!question) {
    return (
      <div className="space-y-4">
        <Link
          href="/questions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text no-underline"
        >
          <ArrowLeft size={16} />
          Back to all questions
        </Link>
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-text">Question Not Found</h2>
          <p className="mt-1 text-sm text-text-muted">
            The question you are looking for may have been deleted.
          </p>
          <div className="mt-4">
            <Link href="/questions" className="btn btn-primary btn-sm no-underline">
              Go to Questions List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const today = getTodayISO();

  // Calculate completed revisions
  const questionRecords = records.filter(
    (r) => r.questionId === question.id && r.completed
  );
  const completedCount = questionRecords.length;
  const progressPercent = Math.round((completedCount / REVISION_INTERVALS.length) * 100);

  // Find next upcoming checkpoint
  let nextCheckpoint: {
    interval: RevisionInterval;
    date: string;
    daysUntil: number;
  } | null = null;

  for (const interval of REVISION_INTERVALS) {
    if (isCheckpointCompleted(question.id, interval, recordsMap)) continue;
    const dateStr = question[REVISION_KEYS[interval]];
    if (dateStr >= today) {
      nextCheckpoint = {
        interval,
        date: dateStr,
        daysUntil: getDaysUntilRevision(dateStr),
      };
      break;
    }
  }

  const handleDelete = () => {
    deleteQuestion(question.id);
    router.push('/questions');
  };

  const handleStatusChange = (newStatus: QuestionStatus) => {
    updateQuestion(question.id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/questions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text no-underline transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Questions
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openEditModal(question.id)}
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            className="btn btn-ghost btn-sm text-danger hover:bg-danger-light"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Question Header Card */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-text break-words">
                {question.questionName}
              </h1>
              <StatusBadge status={question.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-text-muted" />
                Solved on {formatDateLong(question.dateSolved)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-text-muted" />
                Added {formatDateDisplay(question.createdAt.slice(0, 10))}
              </span>
            </div>
          </div>

          {/* Quick status dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-select" className="text-xs font-medium text-text-muted">
              Status:
            </label>
            <select
              id="status-select"
              className="select text-xs py-1.5 px-2.5 h-8 w-auto min-w-[130px]"
              value={question.status}
              onChange={(e) => handleStatusChange(e.target.value as QuestionStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress Bar & Next Checkpoint */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Revision Progress
              </span>
              <p className="text-sm font-medium text-text">
                {completedCount} of 6 revisions completed ({progressPercent}%)
              </p>
            </div>
            {nextCheckpoint && (
              <div className="text-right">
                <span className="text-xs text-text-muted">Next Checkpoint</span>
                <p className="text-sm font-semibold text-primary">
                  {REVISION_LABELS[nextCheckpoint.interval]} on{' '}
                  {formatDateDisplay(nextCheckpoint.date)}{' '}
                  <span className="font-normal text-text-muted text-xs">
                    ({nextCheckpoint.daysUntil === 0
                      ? 'Today'
                      : nextCheckpoint.daysUntil === 1
                      ? 'Tomorrow'
                      : `in ${nextCheckpoint.daysUntil} days`})
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-border">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Spaced Revision Schedule Timeline */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text">Spaced Revision Schedule</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Original intervals: +3, +7, +15, +30, +60, +120 days from solved date. Scheduled dates remain fixed.
          </p>
        </div>

        <div className="space-y-3">
          {REVISION_INTERVALS.map((interval, index) => {
            const scheduledDate = question[REVISION_KEYS[interval]];
            const key = `${question.id}_${interval}`;
            const record = recordsMap.get(key);
            const isDone = record?.completed === true;
            const diff = getDaysUntilRevision(scheduledDate);
            const isDue = diff === 0 && !isDone;
            const isOverdueItem = diff < 0 && !isDone;

            let cardBorder = 'border-border';
            let statusBadge = null;

            if (isDone) {
              cardBorder = 'border-emerald-300 bg-emerald-50/20';
              statusBadge = (
                <span className="rev-completed">
                  <Check size={12} strokeWidth={2.5} />
                  Completed
                </span>
              );
            } else if (isDue) {
              cardBorder = 'border-amber-400 bg-amber-50/20';
              statusBadge = <span className="rev-today">Due Today</span>;
            } else if (isOverdueItem) {
              cardBorder = 'border-danger bg-danger-light/10';
              statusBadge = (
                <span className="rev-overdue">
                  <AlertCircle size={12} />
                  {Math.abs(diff)}d Overdue
                </span>
              );
            } else {
              statusBadge = (
                <span className="text-xs font-medium text-text-muted">
                  In {diff} days
                </span>
              );
            }

            return (
              <div
                key={interval}
                className={`card p-4 transition-all border ${cardBorder} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? 'bg-primary text-white'
                        : isDue
                        ? 'bg-amber-100 text-amber-800'
                        : isOverdueItem
                        ? 'bg-danger-light text-danger'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-text text-sm">
                        {REVISION_LABELS[interval]} Checkpoint
                      </span>
                      {statusBadge}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span>Scheduled: {formatDateLong(scheduledDate)}</span>
                      {isDone && record?.completedAt && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-medium">
                            Completed on {formatDateDisplay(record.completedAt.slice(0, 10))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:self-center self-end">
                  {isDone ? (
                    <button
                      className="btn btn-ghost btn-sm text-text-muted hover:text-danger"
                      onClick={() => markRevision(question.id, interval, false)}
                      title="Unmark completion"
                    >
                      <CheckCircle2 size={15} className="text-primary" />
                      Completed (Undo)
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => markRevision(question.id, interval, true)}
                    >
                      <Check size={14} />
                      Mark Revised
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Question"
        message={`Are you sure you want to delete "${question.questionName}"? This will permanently delete the question and its revision history.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
