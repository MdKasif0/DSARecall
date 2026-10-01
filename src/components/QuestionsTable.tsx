'use client';

import Link from 'next/link';
import { Pencil, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { DSAQuestion, RevisionRecord } from '@/lib/types';
import { REVISION_LABELS } from '@/lib/types';
import {
  formatDateDisplay,
  formatDateShort,
  getNextRevision,
  getQuestionProgress,
  getTodayISO,
} from '@/lib/dates';
import StatusBadge from './StatusBadge';

interface QuestionsTableProps {
  questions: DSAQuestion[];
  recordsMap: Map<string, RevisionRecord>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function QuestionsTable({
  questions,
  recordsMap,
  onEdit,
  onDelete,
}: QuestionsTableProps) {
  const today = getTodayISO();

  return (
    <div className="table-container card">
      <table className="data-table">
        <thead>
          <tr className="bg-slate-50/80">
            <th>Question</th>
            <th>Solved</th>
            <th>Next Revision</th>
            <th>Status</th>
            <th className="min-w-[150px]">Progress</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {questions.map((q) => {
            const nextRev = getNextRevision(q, recordsMap);
            const { completedCount, total, percent } = getQuestionProgress(q.id, recordsMap);

            // Compute next revision pill styling
            let nextRevElement = null;
            if (!nextRev) {
              if (completedCount === 6) {
                nextRevElement = (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <CheckCircle2 size={13} />
                    All 6 Done
                  </span>
                );
              } else {
                nextRevElement = <span className="text-xs text-text-muted">None pending</span>;
              }
            } else {
              const isDue = nextRev.date === today;
              const isPast = nextRev.date < today;

              let badgeStyle = 'bg-slate-100 text-slate-700';
              if (isDue) {
                badgeStyle = 'bg-[#FEF3C7] text-[#B45309] font-bold border border-[#FDE68A]';
              } else if (isPast) {
                badgeStyle = 'bg-danger-light text-danger font-bold border border-[#FECACA]';
              }

              nextRevElement = (
                <div className="flex flex-col gap-0.5">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${badgeStyle}`}>
                    <span>{REVISION_LABELS[nextRev.interval]}</span>
                    <span>·</span>
                    <span>{formatDateShort(nextRev.date)}</span>
                  </span>
                  <span className="text-[0.6875rem] text-text-muted pl-0.5">
                    {nextRev.daysUntil === 0
                      ? 'Due Today'
                      : nextRev.daysUntil < 0
                      ? `${Math.abs(nextRev.daysUntil)}d overdue`
                      : nextRev.daysUntil === 1
                      ? 'Tomorrow'
                      : `in ${nextRev.daysUntil} days`}
                  </span>
                </div>
              );
            }

            return (
              <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                {/* Question Name & Topic */}
                <td className="font-medium text-text max-w-[260px]">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/questions/${q.id}`}
                      className="font-semibold text-text hover:text-primary no-underline block truncate"
                      title={q.questionName}
                    >
                      {q.questionName}
                    </Link>
                    {q.topic && (
                      <span className="inline-block self-start rounded bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-medium text-slate-600">
                        {q.topic}
                      </span>
                    )}
                  </div>
                </td>

                {/* Solved Date */}
                <td className="text-xs text-text-muted">
                  {formatDateDisplay(q.dateSolved)}
                </td>

                {/* Next Revision */}
                <td>{nextRevElement}</td>

                {/* Status */}
                <td>
                  <StatusBadge status={q.status} />
                </td>

                {/* Progress Bar: X / 6 (Y%) */}
                <td>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text font-medium">
                        {completedCount} / {total}
                      </span>
                      <span className="text-text-muted font-semibold">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-border">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/questions/${q.id}`}
                      className="btn btn-ghost btn-sm text-primary p-1.5"
                      title="View Details"
                    >
                      <ArrowRight size={15} />
                    </Link>
                    <button
                      className="btn-icon btn-ghost p-1.5"
                      onClick={() => onEdit(q.id)}
                      aria-label={`Edit ${q.questionName}`}
                      title="Edit Question"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn-icon btn-ghost p-1.5 text-danger"
                      onClick={() => onDelete(q.id)}
                      aria-label={`Delete ${q.questionName}`}
                      title="Delete Question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
