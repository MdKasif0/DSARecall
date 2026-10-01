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
    <div className="table-container card-glass overflow-hidden rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
      <table className="data-table w-full border-collapse text-left">
        <thead>
          <tr className="bg-white/40 border-b border-white/60 backdrop-blur-md">
            <th className="w-10 px-3.5 py-3 text-center">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label="Select all questions"
              />
            </th>
            <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-[0.08em] text-slate-400">
              QUESTION
            </th>
            <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-[0.08em] text-slate-400">
              SOLVED
            </th>
            <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-[0.08em] text-slate-400">
              NEXT REVISION
            </th>
            <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-[0.08em] text-slate-400">
              STATUS
            </th>
            <th className="px-4 py-3 min-w-[180px] font-bold text-[11px] uppercase tracking-[0.08em] text-slate-400">
              PROGRESS
            </th>
            <th className="px-4 py-3 text-right font-bold text-[11px] uppercase tracking-[0.08em] text-slate-400">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/60">
          {questions.map((q) => {
            const nextRev = getNextRevision(q, recordsMap);
            const { completedCount, total, percent } = getQuestionProgress(q.id, recordsMap);
            const isSelected = selectedIds.has(q.id);

            // Compute next revision element
            let nextRevElement = null;
            if (!nextRev) {
              if (completedCount === 6) {
                nextRevElement = (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    All 6 Done
                  </span>
                );
              } else {
                nextRevElement = (
                  <span className="text-xs text-slate-400">None pending</span>
                );
              }
            } else {
              const isDue = nextRev.date === today;
              const isPast = nextRev.date < today;

              let badgeBg = 'bg-white/70 text-slate-700 border-white/80';
              let subtextColor = 'text-slate-400';

              if (isDue) {
                badgeBg = 'bg-amber-500/15 text-amber-800 border-amber-500/25';
                subtextColor = 'text-amber-800 font-bold';
              } else if (isPast) {
                badgeBg = 'bg-rose-500/15 text-rose-700 border-rose-500/25';
                subtextColor = 'text-rose-700 font-bold';
              }

              nextRevElement = (
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-bold border ${badgeBg} self-start shadow-xs`}
                  >
                    <Clock size={12} />
                    <span>
                      {REVISION_LABELS[nextRev.interval]} · {formatDateShort(nextRev.date)}
                    </span>
                  </span>
                  <span className={`text-[11px] ${subtextColor} pl-0.5`}>
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
                  isSelected ? 'bg-emerald-500/10' : 'hover:bg-white/40'
                }`}
              >
                {/* Selection checkbox */}
                <td className="w-10 px-3.5 py-3.5 text-center">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                      className="font-bold text-sm text-slate-900 hover:text-emerald-700 no-underline truncate max-w-[220px]"
                      title={q.questionName}
                    >
                      {q.questionName}
                    </Link>
                    {q.topic && (
                      <span className="rounded-lg bg-white/70 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-white/80 shadow-xs">
                        {q.topic}
                      </span>
                    )}
                  </div>
                </td>

                {/* Solved Date */}
                <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap font-medium">
                  {formatDateDisplay(q.dateSolved)}
                </td>

                {/* Next Revision */}
                <td className="px-4 py-3.5">{nextRevElement}</td>

                {/* Status Badge */}
                <td className="px-4 py-3.5">
                  <StatusBadge status={q.status} />
                </td>

                {/* Thin 5px Progress Bar */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-bold text-[12px]">
                        {completedCount} / {total} revisions
                      </span>
                      <span className="text-slate-400 font-medium text-[11px]">
                        {percent}%
                      </span>
                    </div>
                    {/* Thin 5px progress bar */}
                    <div className="w-full bg-slate-200/60 rounded-full h-[5px] overflow-hidden">
                      <div
                        className="bg-emerald-600 h-[5px] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.35)]"
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
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/80 hover:text-slate-900 border border-transparent hover:border-white/80 transition-all shadow-xs"
                      title="View Details"
                    >
                      <ArrowRight size={14} />
                    </Link>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/80 hover:text-slate-900 border border-transparent hover:border-white/80 transition-all shadow-xs"
                      onClick={() => onEdit(q.id)}
                      aria-label={`Edit ${q.questionName}`}
                      title="Edit Question"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/15 hover:text-rose-700 border border-transparent hover:border-rose-500/25 transition-all shadow-xs"
                      onClick={() => onDelete(q.id)}
                      aria-label={`Delete ${q.questionName}`}
                      title="Delete Question"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/80 hover:text-slate-900 border border-transparent hover:border-white/80 transition-all shadow-xs"
                      onClick={() => onEdit(q.id)}
                      title="More Options"
                    >
                      <MoreVertical size={13} />
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
