'use client';

import Link from 'next/link';
import { Pencil, Trash2, Check, ChevronRight } from 'lucide-react';
import type { DSAQuestion, RevisionRecord } from '@/lib/types';
import { REVISION_INTERVALS, REVISION_KEYS, REVISION_LABELS } from '@/lib/types';
import { formatDateDisplay, isToday, isPast } from '@/lib/dates';
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

  return (
    <div className="card card-hover p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/questions/${question.id}`}
            className="flex items-center gap-1 text-sm font-semibold text-text hover:text-primary no-underline transition-colors"
          >
            <span className="truncate">{question.questionName}</span>
            <ChevronRight size={14} className="shrink-0 text-text-muted" />
          </Link>
          <p className="mt-0.5 text-xs text-text-muted">
            Solved: {formatDateDisplay(question.dateSolved)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge status={question.status} />
        </div>
      </div>

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
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <Link
          href={`/questions/${question.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View Details
        </Link>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onEdit(question.id)}
            aria-label={`Edit ${question.questionName}`}
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            className="btn btn-ghost btn-sm text-danger"
            onClick={() => onDelete(question.id)}
            aria-label={`Delete ${question.questionName}`}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
