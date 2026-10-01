'use client';

import {
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import type { DSAQuestion, RevisionRecord, RevisionInterval } from '@/lib/types';
import {
  REVISION_INTERVALS,
  REVISION_KEYS,
  REVISION_LABELS,
} from '@/lib/types';
import {
  formatDateDisplay,
  formatDateShort,
  getDaysUntilRevision,
} from '@/lib/dates';

interface RevisionTimelineProps {
  question: DSAQuestion;
  recordsMap: Map<string, RevisionRecord>;
  onMarkRevision: (questionId: string, interval: RevisionInterval, completed: boolean) => void;
}

export default function RevisionTimeline({
  question,
  recordsMap,
  onMarkRevision,
}: RevisionTimelineProps) {
  return (
    <div className="card-glass p-6 space-y-6 rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
      <div className="border-b border-white/60 pb-3.5">
        <h3 className="text-base font-bold text-slate-900">Revision Timeline</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Spaced repetition cycle (+3, +7, +15, +30, +60, +120 days)
        </p>
      </div>

      <div className="relative pl-7 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-3 before:w-[2px] before:bg-white/80 before:shadow-[0_0_8px_rgba(255,255,255,0.9)]">
        {/* Origin Step: Solved */}
        <div className="relative flex items-start justify-between gap-4">
          {/* Node Icon */}
          <div className="absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm ring-4 ring-white/90">
            <Check size={12} strokeWidth={3} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Solved</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDateDisplay(question.dateSolved)}
            </p>
          </div>

          <span className="rounded-lg bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-500/25">
            Initial Solve
          </span>
        </div>

        {/* 6 Spaced Revision Checkpoints */}
        {REVISION_INTERVALS.map((interval) => {
          const scheduledDate = question[REVISION_KEYS[interval]];
          const recordKey = `${question.id}_${interval}`;
          const record = recordsMap.get(recordKey);
          const isDone = record?.completed === true;

          const diff = getDaysUntilRevision(scheduledDate);
          const isDue = diff === 0 && !isDone;
          const isOverdue = diff < 0 && !isDone;

          return (
            <div key={interval} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-white/80 bg-white/50 backdrop-blur-md hover:bg-white/70 transition-all shadow-xs">
              {/* Node Bullet */}
              <div
                className={`absolute -left-7 top-4 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-4 ring-white/90 ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isDue
                    ? 'bg-amber-500/20 text-amber-800 border-2 border-amber-500'
                    : isOverdue
                    ? 'bg-rose-500/20 text-rose-700 border-2 border-rose-500'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}
              >
                {isDone ? (
                  <Check size={12} strokeWidth={3} />
                ) : isDue ? (
                  <Clock size={11} strokeWidth={2.5} />
                ) : isOverdue ? (
                  <AlertCircle size={11} strokeWidth={2.5} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Checkpoint Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {REVISION_LABELS[interval]}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {formatDateDisplay(scheduledDate)}
                  </span>

                  {isDone ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-500/25">
                      Completed
                    </span>
                  ) : isDue ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-500/25">
                      Due Today
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-500/25">
                      {Math.abs(diff)}d Overdue
                    </span>
                  ) : (
                    <span className="rounded-lg bg-white/70 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-white/80 shadow-xs">
                      In {diff} days
                    </span>
                  )}
                </div>

                {isDone && record?.completedAt && (
                  <p className="mt-1 text-xs text-emerald-700 font-semibold">
                    Revised on {formatDateShort(record.completedAt.slice(0, 10))}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="self-end sm:self-center shrink-0">
                {isDone ? (
                  <button
                    className="btn btn-ghost btn-sm text-xs text-slate-400 hover:text-rose-600 rounded-xl"
                    onClick={() => onMarkRevision(question.id, interval, false)}
                    title="Undo completion"
                  >
                    <RotateCcw size={12} />
                    <span>Undo</span>
                  </button>
                ) : (
                  <button
                    className={`btn btn-sm ${
                      isDue || isOverdue ? 'btn-primary' : 'btn-secondary'
                    }`}
                    onClick={() => onMarkRevision(question.id, interval, true)}
                  >
                    <CheckCircle2 size={13} />
                    <span>Mark Revised</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
