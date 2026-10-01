'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
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
import TopBar from '@/components/TopBar';
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
        <TopBar />
        <div className="card p-8 text-center">
          <h2 className="text-lg font-bold text-text">Question Not Found</h2>
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
      {/* Top Bar with Breadcrumb and Profile */}
      <TopBar />

      {/* Main Question Header Card */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text break-words">
                {question.questionName}
              </h1>
              {question.topic && (
                <span className="rounded bg-[#F2ECE2] px-2.5 py-0.5 text-xs font-semibold text-[#71695F] border border-[#E4DDD2]">
                  {question.topic}
                </span>
              )}
              <StatusBadge status={question.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                <Calendar size={14} className="text-[#8B6F47]" />
                Solved on {formatDateLong(question.dateSolved)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-text-muted" />
                Added {formatDateDisplay(question.createdAt.slice(0, 10))}
              </span>
            </div>
          </div>

          {/* Quick Actions & Status dropdown */}
          <div className="flex flex-wrap items-center gap-2 self-start">
            <select
              id="status-select"
              className="select text-xs py-1 px-2.5 h-8.5 w-auto min-w-[125px]"
              value={question.status}
              onChange={(e) => handleStatusChange(e.target.value as QuestionStatus)}
              aria-label="Change question status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => openEditModal(question.id)}
            >
              <Pencil size={13} />
              <span>Edit</span>
            </button>
            <button
              className="btn btn-ghost btn-sm text-[#A65D50] hover:bg-[#F4E4DF]"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Next Checkpoint */}
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
            <div>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                REVISION PROGRESS
              </span>
              <p className="text-sm font-semibold text-text mt-0.5">
                {completedCount} of 6 revisions completed ({progressPercent}%)
              </p>
            </div>
            {nextCheckpoint && (
              <div className="text-left sm:text-right">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  NEXT CHECKPOINT
                </span>
                <p className="text-xs font-bold text-[#8B6F47] mt-0.5">
                  {REVISION_LABELS[nextCheckpoint.interval]} · {formatDateDisplay(nextCheckpoint.date)}{' '}
                  <span className="font-normal text-text-muted text-[0.6875rem]">
                    ({nextCheckpoint.daysUntil === 0
                      ? 'Due today'
                      : nextCheckpoint.daysUntil === 1
                      ? 'Tomorrow'
                      : `in ${nextCheckpoint.daysUntil} days`})
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="w-full bg-[#E7DED1] rounded-full h-[6px] overflow-hidden">
            <div
              className="bg-[#8B6F47] h-[6px] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Spaced Revision Schedule Timeline matching Section 19 */}
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
