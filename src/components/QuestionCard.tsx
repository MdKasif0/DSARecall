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
              className="flex items-center gap-1 text-sm font-bold text-text hover:text-[#8B6F47] no-underline transition-colors"
            >
              <span className="truncate">{question.questionName}</span>
              <ChevronRight size={14} className="shrink-0 text-text-muted" />
            </Link>
            {question.topic && (
              <span className="rounded bg-[#F2ECE2] px-2 py-0.5 text-[0.6875rem] font-medium text-[#71695F] border border-[#E4DDD2]">
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

      {/* Progress Bar (5px matching Section 16) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted text-[0.6875rem]">Progress</span>
          <span className="font-semibold text-text text-[0.75rem]">
            {completedCount} / {total} revisions ({percent}%)
          </span>
        </div>
        <div className="w-full bg-[#E7DED1] rounded-full h-[5px] overflow-hidden">
          <div
            className="bg-[#8B6F47] h-[5px] rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Next Revision callout if available */}
      {nextRev && (
        <div className="rounded-md bg-[#FAF7F2] border border-border px-3 py-1.5 text-xs flex items-center justify-between">
          <span className="text-text-muted">Next Checkpoint:</span>
          <span className="font-semibold text-[#8B6F47]">
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

          let badgeClass = 'bg-[#FAF7F2] text-text-muted border border-border';
          if (completed) {
            badgeClass = 'bg-[#E8EDE4] text-[#65755D] font-medium border border-[#D7DFD2]';
          } else if (today) {
            badgeClass = 'bg-[#EDE1CF] text-[#795B39] font-bold border border-[#DFD1BC]';
          } else if (past) {
            badgeClass = 'bg-[#F4E4DF] text-[#925A4D] font-bold border border-[#E6D0CA]';
          }

          return (
            <div
              key={interval}
              className={`flex items-center justify-between rounded px-2 py-1.5 text-xs ${badgeClass}`}
            >
              <span className="flex items-center gap-1 text-[0.6875rem]">
                {completed && <Check size={11} strokeWidth={2.5} />}
                {REVISION_LABELS[interval]}
              </span>
              <span className="font-bold text-[0.6875rem]">
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
          className="text-xs font-semibold text-[#8B6F47] hover:underline no-underline"
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
            <span>Edit</span>
          </button>
          <button
            className="btn btn-ghost btn-sm py-1 px-2 text-xs text-[#A65D50] hover:bg-[#F4E4DF]"
            onClick={() => onDelete(question.id)}
            aria-label={`Delete ${question.questionName}`}
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
