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

      {/* Main Question Header Card (Liquid Glass) */}
      <div className="card-glass p-6 rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
                {question.questionName}
              </h1>
              {question.topic && (
                <span className="rounded-lg bg-white/70 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-white/80 shadow-xs">
                  {question.topic}
                </span>
              )}
              <StatusBadge status={question.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Calendar size={14} className="text-emerald-600" />
                Solved on {formatDateLong(question.dateSolved)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                Added {formatDateDisplay(question.createdAt.slice(0, 10))}
              </span>
            </div>
          </div>

          {/* Quick Actions & Status dropdown */}
          <div className="flex flex-wrap items-center gap-2 self-start">
            <select
              id="status-select"
              className="select text-xs py-1.5 px-3 h-9 w-auto min-w-[125px] bg-white/70 backdrop-blur-md border border-white/80 rounded-xl shadow-xs"
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
              className="btn btn-ghost btn-sm text-rose-700 hover:bg-rose-500/10 rounded-xl"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Next Checkpoint */}
        <div className="mt-6 border-t border-white/60 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                REVISION PROGRESS
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {completedCount} of 6 revisions completed ({progressPercent}%)
              </p>
            </div>
            {nextCheckpoint && (
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  NEXT CHECKPOINT
                </span>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  {REVISION_LABELS[nextCheckpoint.interval]} · {formatDateDisplay(nextCheckpoint.date)}{' '}
                  <span className="font-normal text-slate-500 text-[11px]">
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

          <div className="w-full bg-slate-200/60 rounded-full h-[6px] overflow-hidden">
            <div
              className="bg-emerald-600 h-[6px] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.35)]"
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
