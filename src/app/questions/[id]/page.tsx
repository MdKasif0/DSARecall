'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pencil,
  Trash2,
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
import RevisionTimeline from '@/components/RevisionTimeline';
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
              {question.topic && (
                <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {question.topic}
                </span>
              )}
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
      <RevisionTimeline
        question={question}
        recordsMap={recordsMap}
        onMarkRevision={markRevision}
      />

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
