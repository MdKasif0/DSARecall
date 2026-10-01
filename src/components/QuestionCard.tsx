'use client';

import Link from 'next/link';
import { Pencil, Trash2, Check, ChevronRight } from 'lucide-react';
import type { DSAQuestion, RevisionRecord } from '@/lib/types';
import { REVISION_INTERVALS, REVISION_KEYS, REVISION_LABELS } from '@/lib/types';
import {
  formatDateDisplay,
  isToday,
  isPast,
  getQuestionProgress,
  getNextRevision,
} from '@/lib/dates';
import StatusBadge from './StatusBadge';

interface QuestionCardProps {
  question: DSAQuestion;
  recordsMap?: Map<string, RevisionRecord>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function QuestionCard({
  question,
  recordsMap,
  onEdit,
  onDelete,
}: QuestionCardProps) {
  const isDone = (interval: number) => {
    if (!recordsMap) return false;
    return recordsMap.get(`${question.id}_${interval}`)?.completed === true;
  };

  const { completedCount, total, percent } = recordsMap
    ? getQuestionProgress(question.id, recordsMap)
    : { completedCount: 0, total: 6, percent: 0 };

  const nextRev = recordsMap ? getNextRevision(question, recordsMap) : null;

  return (
    <div className="card card-hover p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/questions/${question.id}`}
              className="flex items-center gap-1 text-sm font-semibold text-text hover:text-primary no-underline transition-colors"
            >
              <span className="truncate">{question.questionName}</span>
              <ChevronRight size={14} className="shrink-0 text-text-muted" />
            </Link>
            {question.topic && (
              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[0.6875rem] font-medium text-slate-700">
                {question.topic}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Solved: {formatDateDisplay(question.dateSolved)}
          </p>
        </div>
        <StatusBadge status={question.status} />
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Progress</span>
          <span className="font-semibold text-text">
            {completedCount} / {total} ({percent}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-border">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Next Revision callout if available */}
      {nextRev && (
        <div className="rounded bg-slate-50 border border-border px-2.5 py-1.5 text-xs flex items-center justify-between">
          <span className="text-text-muted">Next Checkpoint:</span>
          <span className="font-semibold text-primary">
            {REVISION_LABELS[nextRev.interval]} · {formatDateDisplay(nextRev.date)}
          </span>
        </div>
      )}

      {/* Revision dates grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {REVISION_INTERVALS.map((interval) => {
          const key = REVISION_KEYS[interval];
          const dateStr = question[key];
          const completed = isDone(interval);
          const today = isToday(dateStr);
          const past = isPast(dateStr);

          let badgeClass = 'bg-bg text-text-muted';
          if (completed) {
            badgeClass = 'bg-primary-light text-primary font-medium';
          } else if (today) {
            badgeClass = 'bg-[#FEF3C7] text-[#B45309] font-semibold border border-[#FDE68A]';
          } else if (past) {
            badgeClass = 'bg-danger-light text-danger font-semibold border border-[#FECACA]';
          }

          return (
            <div
              key={interval}
              className={`flex items-center justify-between rounded px-2 py-1.5 text-xs ${badgeClass}`}
            >
              <span className="flex items-center gap-1">
                {completed && <Check size={11} strokeWidth={2.5} />}
                {REVISION_LABELS[interval]}
              </span>
              <span className="font-medium">
                {formatDateDisplay(dateStr).replace(/, \d{4}$/, '')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <Link
          href={`/questions/${question.id}`}
          className="text-xs font-semibold text-primary hover:underline no-underline"
        >
          View Full Timeline →
        </Link>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-sm py-1 px-2 text-xs"
            onClick={() => onEdit(question.id)}
            aria-label={`Edit ${question.questionName}`}
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            className="btn btn-ghost btn-sm py-1 px-2 text-xs text-danger"
            onClick={() => onDelete(question.id)}
            aria-label={`Delete ${question.questionName}`}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
