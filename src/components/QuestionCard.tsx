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
    <div className="card-glass p-4 space-y-3 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/questions/${question.id}`}
              className="flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-emerald-700 no-underline transition-colors"
            >
              <span className="truncate">{question.questionName}</span>
              <ChevronRight size={14} className="shrink-0 text-slate-400" />
            </Link>
            {question.topic && (
              <span className="rounded-lg bg-white/70 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-white/80 shadow-xs">
                {question.topic}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400 font-medium">
            Solved: {formatDateDisplay(question.dateSolved)}
          </p>
        </div>
        <StatusBadge status={question.status} />
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Progress</span>
          <span className="font-bold text-slate-800 text-[12px]">
            {completedCount} / {total} revisions ({percent}%)
          </span>
        </div>
        <div className="w-full bg-slate-200/60 rounded-full h-[5px] overflow-hidden">
          <div
            className="bg-emerald-600 h-[5px] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.35)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Next Revision callout if available */}
      {nextRev && (
        <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 px-3 py-1.5 text-xs flex items-center justify-between shadow-xs">
          <span className="text-slate-500 font-medium">Next Checkpoint:</span>
          <span className="font-bold text-emerald-700">
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

          let badgeClass = 'bg-white/60 text-slate-600 border border-white/80';
          if (completed) {
            badgeClass = 'bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-500/25';
          } else if (today) {
            badgeClass = 'bg-amber-500/15 text-amber-800 font-bold border border-amber-500/25';
          } else if (past) {
            badgeClass = 'bg-rose-500/15 text-rose-700 font-bold border border-rose-500/25';
          }

          return (
            <div
              key={interval}
              className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${badgeClass} shadow-xs`}
            >
              <span className="flex items-center gap-1 text-[11px]">
                {completed && <Check size={11} strokeWidth={2.5} />}
                {REVISION_LABELS[interval]}
              </span>
              <span className="font-bold text-[11px]">
                {formatDateDisplay(dateStr).replace(/, \d{4}$/, '')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-white/60 pt-2.5">
        <Link
          href={`/questions/${question.id}`}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 no-underline"
        >
          View Full Timeline →
        </Link>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-sm py-1 px-2 text-xs rounded-lg text-slate-600 hover:bg-white/80"
            onClick={() => onEdit(question.id)}
            aria-label={`Edit ${question.questionName}`}
          >
            <Pencil size={13} />
            <span>Edit</span>
          </button>
          <button
            className="btn btn-ghost btn-sm py-1 px-2 text-xs text-rose-700 hover:bg-rose-500/10 rounded-lg"
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
