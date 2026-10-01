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
    <div className="card p-6 space-y-6">
      <div className="border-b border-border pb-3.5">
        <h3 className="text-base font-bold text-text">Revision Timeline</h3>
        <p className="text-xs text-text-muted mt-0.5">
          Spaced repetition cycle (+3, +7, +15, +30, +60, +120 days)
        </p>
      </div>

      <div className="relative pl-7 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-3 before:w-[2px] before:bg-[#E4DDD2]">
        {/* Origin Step: Solved */}
        <div className="relative flex items-start justify-between gap-4">
          {/* Node Icon */}
          <div className="absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#5F4930] text-white shadow-sm ring-4 ring-[#FFFDF9]">
            <Check size={12} strokeWidth={3} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-bold text-text">Solved</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {formatDateDisplay(question.dateSolved)}
            </p>
          </div>

          <span className="rounded bg-[#E8EDE4] px-2.5 py-0.5 text-xs font-semibold text-[#65755D] border border-[#D7DFD2]">
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
            <div key={interval} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-[#FAF7F2] hover:bg-[#F8F4ED] transition-colors">
              {/* Node Bullet matching Section 19 */}
              <div
                className={`absolute -left-7 top-3.5 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-4 ring-[#FFFDF9] ${
                  isDone
                    ? 'bg-[#5F4930] text-white'
                    : isDue
                    ? 'bg-[#EDE1CF] text-[#795B39] border-2 border-[#8B6F47]'
                    : isOverdue
                    ? 'bg-[#F4E4DF] text-[#A65D50] border-2 border-[#A65D50]'
                    : 'bg-[#FFFDF9] text-[#9A9287] border-2 border-[#D5CCBF]'
                }`}
              >
                {isDone ? (
                  <Check size={12} strokeWidth={3} />
                ) : isDue ? (
                  <Clock size={11} strokeWidth={2.5} />
                ) : isOverdue ? (
                  <AlertCircle size={11} strokeWidth={2.5} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D5CCBF]" />
                )}
              </div>

              {/* Checkpoint Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-text">
                    {REVISION_LABELS[interval]}
                  </span>
                  <span className="text-xs text-text-secondary font-medium">
                    {formatDateDisplay(scheduledDate)}
                  </span>

                  {isDone ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#E8EDE4] px-2 py-0.5 text-xs font-semibold text-[#65755D] border border-[#D7DFD2]">
                      Completed
                    </span>
                  ) : isDue ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#EDE1CF] px-2 py-0.5 text-xs font-bold text-[#795B39] border border-[#DFD1BC]">
                      Due Today
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#F4E4DF] px-2 py-0.5 text-xs font-bold text-[#A65D50] border border-[#E6D0CA]">
                      {Math.abs(diff)}d Overdue
                    </span>
                  ) : (
                    <span className="rounded bg-[#F2ECE2] px-2 py-0.5 text-[0.6875rem] font-medium text-[#71695F]">
                      In {diff} days
                    </span>
                  )}
                </div>

                {isDone && record?.completedAt && (
                  <p className="mt-1 text-xs text-[#6F8064] font-medium">
                    Revised on {formatDateShort(record.completedAt.slice(0, 10))}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="self-end sm:self-center shrink-0">
                {isDone ? (
                  <button
                    className="btn btn-ghost btn-sm text-xs text-text-muted hover:text-[#A65D50]"
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
