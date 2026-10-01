'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, ArrowRight, CheckCircle2, Clock, MoreVertical } from 'lucide-react';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = questions.length > 0 && selectedIds.size === questions.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  return (
    <div className="table-container card overflow-hidden border border-border">
      <table className="data-table w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#FAF7F2] border-b border-border">
            <th className="w-10 px-3 py-3 text-center">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-[#D5CCBF] text-[#8B6F47] focus:ring-[#8B6F47] cursor-pointer"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label="Select all questions"
              />
            </th>
            <th className="px-4 py-3 font-semibold text-[0.6875rem] uppercase tracking-[0.08em] text-text-secondary">
              QUESTION
            </th>
            <th className="px-4 py-3 font-semibold text-[0.6875rem] uppercase tracking-[0.08em] text-text-secondary">
              SOLVED
            </th>
            <th className="px-4 py-3 font-semibold text-[0.6875rem] uppercase tracking-[0.08em] text-text-secondary">
              NEXT REVISION
            </th>
            <th className="px-4 py-3 font-semibold text-[0.6875rem] uppercase tracking-[0.08em] text-text-secondary">
              STATUS
            </th>
            <th className="px-4 py-3 min-w-[180px] font-semibold text-[0.6875rem] uppercase tracking-[0.08em] text-text-secondary">
              PROGRESS
            </th>
            <th className="px-4 py-3 text-right font-semibold text-[0.6875rem] uppercase tracking-[0.08em] text-text-secondary">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {questions.map((q) => {
            const nextRev = getNextRevision(q, recordsMap);
            const { completedCount, total, percent } = getQuestionProgress(q.id, recordsMap);
            const isSelected = selectedIds.has(q.id);

            // Compute next revision element matching Section 15
            let nextRevElement = null;
            if (!nextRev) {
              if (completedCount === 6) {
                nextRevElement = (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6F8064]">
                    <CheckCircle2 size={14} className="text-[#6F8064]" />
                    All 6 Done
                  </span>
                );
              } else {
                nextRevElement = (
                  <span className="text-xs text-text-muted">None pending</span>
                );
              }
            } else {
              const isDue = nextRev.date === today;
              const isPast = nextRev.date < today;

              let badgeBg = 'bg-[#F1E9DE] text-[#5F4930] border-[#E4DDD2]';
              let subtextColor = 'text-text-muted';

              if (isDue) {
                badgeBg = 'bg-[#EDE1CF] text-[#795B39] border-[#DFD1BC]';
                subtextColor = 'text-[#B18A50] font-semibold';
              } else if (isPast) {
                badgeBg = 'bg-[#F4E4DF] text-[#925A4D] border-[#E6D0CA]';
                subtextColor = 'text-[#A65D50] font-semibold';
              }

              nextRevElement = (
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold border ${badgeBg} self-start`}
                  >
                    <Clock size={12} />
                    <span>
                      {REVISION_LABELS[nextRev.interval]} · {formatDateShort(nextRev.date)}
                    </span>
                  </span>
                  <span className={`text-[0.6875rem] ${subtextColor} pl-0.5`}>
                    {nextRev.daysUntil === 0
                      ? 'Due today'
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
              <tr
                key={q.id}
                className={`transition-colors ${
                  isSelected ? 'bg-[#F8F4ED]' : 'hover:bg-[#FAF7F2]'
                }`}
              >
                {/* Selection checkbox */}
                <td className="w-10 px-3 py-3.5 text-center">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-[#D5CCBF] text-[#8B6F47] focus:ring-[#8B6F47] cursor-pointer"
                    checked={isSelected}
                    onChange={() => toggleSelectOne(q.id)}
                    aria-label={`Select ${q.questionName}`}
                  />
                </td>

                {/* Question Name + Topic */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/questions/${q.id}`}
                      className="font-bold text-sm text-[#29251F] hover:text-[#8B6F47] no-underline truncate max-w-[220px]"
                      title={q.questionName}
                    >
                      {q.questionName}
                    </Link>
                    {q.topic && (
                      <span className="rounded bg-[#F2ECE2] px-2 py-0.5 text-[0.6875rem] font-medium text-[#71695F] border border-[#E4DDD2]">
                        {q.topic}
                      </span>
                    )}
                  </div>
                </td>

                {/* Solved Date */}
                <td className="px-4 py-3.5 text-xs text-text-secondary whitespace-nowrap">
                  {formatDateDisplay(q.dateSolved)}
                </td>

                {/* Next Revision */}
                <td className="px-4 py-3.5">{nextRevElement}</td>

                {/* Status Badge */}
                <td className="px-4 py-3.5">
                  <StatusBadge status={q.status} />
                </td>

                {/* Thin 5px Progress Bar matching Section 16 */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#29251F] font-semibold text-[0.75rem]">
                        {completedCount} / {total} revisions
                      </span>
                      <span className="text-text-muted font-medium text-[0.6875rem]">
                        {percent}%
                      </span>
                    </div>
                    {/* Thin 5px progress bar */}
                    <div className="w-full bg-[#E7DED1] rounded-full h-[5px] overflow-hidden">
                      <div
                        className="bg-[#8B6F47] h-[5px] rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/questions/${q.id}`}
                      className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-[#F1E9DE] hover:text-[#5F4930] transition-colors"
                      title="View Details"
                    >
                      <ArrowRight size={15} />
                    </Link>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-[#F1E9DE] hover:text-[#5F4930] transition-colors"
                      onClick={() => onEdit(q.id)}
                      aria-label={`Edit ${q.questionName}`}
                      title="Edit Question"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-[#F4E4DF] hover:text-[#A65D50] transition-colors"
                      onClick={() => onDelete(q.id)}
                      aria-label={`Delete ${q.questionName}`}
                      title="Delete Question"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:bg-[#F1E9DE] hover:text-text transition-colors"
                      onClick={() => onEdit(q.id)}
                      title="More Options"
                    >
                      <MoreVertical size={14} />
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
