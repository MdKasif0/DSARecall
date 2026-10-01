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
    <div className="table-container card overflow-hidden border border-border">
      <table className="data-table w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#FAF7F2] border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            <th className="sticky left-0 bg-[#FAF7F2] z-10 shadow-[1px_0_0_0_#E4DDD2] px-4 py-3">
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
        <tbody className="divide-y divide-border bg-surface">
          {questions.map((q) => {
            const hasDueToday = isDueToday(q, recordsMap);

            return (
              <tr key={q.id} className="hover:bg-[#FAF7F2] transition-colors">
                {/* Sticky Question Name */}
                <td className="sticky left-0 bg-surface z-10 shadow-[1px_0_0_0_#E4DDD2] px-4 py-3 font-semibold text-sm text-[#29251F] max-w-[200px]">
                  <Link
                    href={`/questions/${q.id}`}
                    className="font-bold text-text hover:text-[#8B6F47] no-underline block truncate"
                    title={q.questionName}
                  >
                    {q.questionName}
                  </Link>
                </td>

                {/* Topic */}
                <td className="px-3 py-3">
                  <span className="inline-block rounded bg-[#F2ECE2] px-2 py-0.5 text-[0.6875rem] font-medium text-[#71695F] border border-[#E4DDD2]">
                    {q.topic || 'General'}
                  </span>
                </td>

                {/* Date Solved */}
                <td className="px-3 py-3 text-text-secondary text-xs whitespace-nowrap">
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

                {/* Due Today (Excel Formula reproduction: IF(OR(...), "YES", "NO")) */}
                <td className="px-3 py-3 text-center">
                  {hasDueToday ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#EDE1CF] px-2 py-0.5 text-[0.6875rem] font-bold text-[#795B39] border border-[#DFD1BC]">
                      <CheckCircle2 size={11} />
                      YES
                    </span>
                  ) : (
                    <span className="text-[0.6875rem] text-text-muted">NO</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
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
