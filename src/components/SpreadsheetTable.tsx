'use client';

import Link from 'next/link';
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import type { DSAQuestion, RevisionRecord } from '@/lib/types';
import { formatDateDisplay, isDueToday } from '@/lib/dates';
import StatusBadge from './StatusBadge';
import RevisionCell from './RevisionCell';

interface SpreadsheetTableProps {
  questions: DSAQuestion[];
  recordsMap: Map<string, RevisionRecord>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SpreadsheetTable({
  questions,
  recordsMap,
  onEdit,
  onDelete,
}: SpreadsheetTableProps) {
  const isDone = (qId: string, interval: number) => {
    return recordsMap.get(`${qId}_${interval}`)?.completed === true;
  };

  return (
    <div className="table-container card-glass overflow-hidden rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
      <table className="data-table w-full border-collapse text-left">
        <thead>
          <tr className="bg-white/40 border-b border-white/60 backdrop-blur-md text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
            <th className="sticky left-0 bg-white/70 backdrop-blur-md z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.8)] px-4 py-3">
              Question Name
            </th>
            <th className="px-3 py-3">Topic</th>
            <th className="px-3 py-3">Date Solved</th>
            <th className="px-3 py-3 text-center">+3 Days</th>
            <th className="px-3 py-3 text-center">+7 Days</th>
            <th className="px-3 py-3 text-center">+15 Days</th>
            <th className="px-3 py-3 text-center">+30 Days</th>
            <th className="px-3 py-3 text-center">+60 Days</th>
            <th className="px-3 py-3 text-center">+120 Days</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 text-center">Due Today</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/60">
          {questions.map((q) => {
            const hasDueToday = isDueToday(q, recordsMap);

            return (
              <tr key={q.id} className="hover:bg-white/40 transition-colors">
                {/* Sticky Question Name */}
                <td className="sticky left-0 bg-white/70 backdrop-blur-md z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.8)] px-4 py-3 font-bold text-sm text-slate-900 max-w-[200px]">
                  <Link
                    href={`/questions/${q.id}`}
                    className="font-bold text-slate-900 hover:text-emerald-700 no-underline block truncate"
                    title={q.questionName}
                  >
                    {q.questionName}
                  </Link>
                </td>

                {/* Topic */}
                <td className="px-3 py-3">
                  <span className="inline-block rounded-lg bg-white/70 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-white/80 shadow-xs">
                    {q.topic || 'General'}
                  </span>
                </td>

                {/* Date Solved */}
                <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap font-medium">
                  {formatDateDisplay(q.dateSolved)}
                </td>

                {/* Revision Columns */}
                <td className="px-3 py-3 text-center">
                  <RevisionCell dateStr={q.revision3} isCompleted={isDone(q.id, 3)} />
                </td>
                <td className="px-3 py-3 text-center">
                  <RevisionCell dateStr={q.revision7} isCompleted={isDone(q.id, 7)} />
                </td>
                <td className="px-3 py-3 text-center">
                  <RevisionCell dateStr={q.revision15} isCompleted={isDone(q.id, 15)} />
                </td>
                <td className="px-3 py-3 text-center">
                  <RevisionCell dateStr={q.revision30} isCompleted={isDone(q.id, 30)} />
                </td>
                <td className="px-3 py-3 text-center">
                  <RevisionCell dateStr={q.revision60} isCompleted={isDone(q.id, 60)} />
                </td>
                <td className="px-3 py-3 text-center">
                  <RevisionCell dateStr={q.revision120} isCompleted={isDone(q.id, 120)} />
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                  <StatusBadge status={q.status} />
                </td>

                {/* Due Today */}
                <td className="px-3 py-3 text-center">
                  {hasDueToday ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-500/25">
                      <CheckCircle2 size={11} />
                      YES
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">NO</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
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
