'use client';

import {
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
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
    <div className="card p-5 space-y-4">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-bold text-text">Revision Timeline</h3>
        <p className="text-xs text-text-muted mt-0.5">
          Fixed 6-checkpoint spaced schedule: +3, +7, +15, +30, +60, and +120 days from solved date
        </p>
      </div>

      <div className="timeline-list pl-6">
        {/* Origin Step: Solved */}
        <div className="timeline-item">
          <div className="timeline-bullet completed">
            <Check size={10} strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-text">Problem Solved</span>
            <span className="text-xs text-text-muted">
              {formatDateDisplay(question.dateSolved)}
            </span>
          </div>
        </div>

        {/* 6 Revision Checkpoints */}
        {REVISION_INTERVALS.map((interval) => {
          const scheduledDate = question[REVISION_KEYS[interval]];
          const recordKey = `${question.id}_${interval}`;
          const record = recordsMap.get(recordKey);
          const isDone = record?.completed === true;

          const diff = getDaysUntilRevision(scheduledDate);
          const isDue = diff === 0 && !isDone;
          const isOverdue = diff < 0 && !isDone;

          let bulletClass = 'future';
          if (isDone) bulletClass = 'completed';
          else if (isDue) bulletClass = 'due';
          else if (isOverdue) bulletClass = 'overdue';

          return (
            <div key={interval} className="timeline-item">
              <div className={`timeline-bullet ${bulletClass}`}>
                {isDone ? (
                  <Check size={10} strokeWidth={3} />
                ) : isDue ? (
                  <span className="block h-1.5 w-1.5 rounded-full bg-[#B45309]" />
                ) : isOverdue ? (
                  <span className="block h-1.5 w-1.5 rounded-full bg-danger" />
                ) : (
                  <span className="block h-1.5 w-1.5 rounded-full bg-slate-400" />
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-text">
                      {REVISION_LABELS[interval]} Checkpoint
                    </span>

                    {/* Status Badges with icons and text */}
                    {isDone ? (
                      <span className="rev-completed">
                        <Check size={11} strokeWidth={3} />
                        Completed
                      </span>
                    ) : isDue ? (
                      <span className="rev-today">
                        <Clock size={11} />
                        Due Today
                      </span>
                    ) : isOverdue ? (
                      <span className="rev-overdue">
                        <AlertCircle size={11} />
                        {Math.abs(diff)}d Overdue
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-text-muted">
                        In {diff} days
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Scheduled for {formatDateDisplay(scheduledDate)}
                    </span>
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

                {/* Inline Action */}
                <div className="self-end sm:self-center shrink-0">
                  {isDone ? (
                    <button
                      className="btn btn-ghost btn-sm text-xs text-text-muted hover:text-danger"
                      onClick={() => onMarkRevision(question.id, interval, false)}
                      title="Undo completion"
                    >
                      <RotateCcw size={12} />
                      Undo
                    </button>
                  ) : (
                    <button
                      className={`btn btn-sm ${
                        isDue || isOverdue ? 'btn-primary' : 'btn-secondary'
                      }`}
                      onClick={() => onMarkRevision(question.id, interval, true)}
                    >
                      <CheckCircle2 size={13} />
                      Mark Revised
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
