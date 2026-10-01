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
    <div className="table-container card">
      <table className="data-table">
        <thead>
          <tr className="bg-slate-50/80">
            <th className="sticky left-0 bg-slate-50/95 z-10 shadow-[1px_0_0_0_#E2E8F0]">
              Question Name
            </th>
            <th>Topic</th>
            <th>Date Solved</th>
            <th className="text-center">+3 Days</th>
            <th className="text-center">+7 Days</th>
            <th className="text-center">+15 Days</th>
            <th className="text-center">+30 Days</th>
            <th className="text-center">+60 Days</th>
            <th className="text-center">+120 Days</th>
            <th>Status</th>
            <th className="text-center">Due Today?</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {questions.map((q) => {
            const hasDueToday = isDueToday(q, recordsMap);

            return (
              <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                {/* Sticky Question Name */}
                <td className="sticky left-0 bg-surface z-10 shadow-[1px_0_0_0_#E2E8F0] font-medium text-text max-w-[200px]">
                  <Link
                    href={`/questions/${q.id}`}
                    className="font-semibold text-text hover:text-primary no-underline block truncate"
                    title={q.questionName}
                  >
                    {q.questionName}
                  </Link>
                </td>

                {/* Topic */}
                <td>
                  <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-medium text-slate-700">
                    {q.topic || 'General'}
                  </span>
                </td>

                {/* Date Solved */}
                <td className="text-text-muted text-xs">
                  {formatDateDisplay(q.dateSolved)}
                </td>

                {/* Revision Columns */}
                <td className="text-center">
                  <RevisionCell dateStr={q.revision3} isCompleted={isDone(q.id, 3)} />
                </td>
                <td className="text-center">
                  <RevisionCell dateStr={q.revision7} isCompleted={isDone(q.id, 7)} />
                </td>
                <td className="text-center">
                  <RevisionCell dateStr={q.revision15} isCompleted={isDone(q.id, 15)} />
                </td>
                <td className="text-center">
                  <RevisionCell dateStr={q.revision30} isCompleted={isDone(q.id, 30)} />
                </td>
                <td className="text-center">
                  <RevisionCell dateStr={q.revision60} isCompleted={isDone(q.id, 60)} />
                </td>
                <td className="text-center">
                  <RevisionCell dateStr={q.revision120} isCompleted={isDone(q.id, 120)} />
                </td>

                {/* Status */}
                <td>
                  <StatusBadge status={q.status} />
                </td>

                {/* Due Today (Excel Formula reproduction: IF(OR(...), "YES", "NO")) */}
                <td className="text-center">
                  {hasDueToday ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[#FEF3C7] px-2 py-0.5 text-[0.6875rem] font-bold text-[#B45309] border border-[#FDE68A]">
                      <CheckCircle2 size={11} />
                      YES
                    </span>
                  ) : (
                    <span className="text-[0.6875rem] text-text-muted">NO</span>
                  )}
                </td>

                {/* Actions */}
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="btn-icon btn-ghost p-1"
                      onClick={() => onEdit(q.id)}
                      aria-label={`Edit ${q.questionName}`}
                      title="Edit Question"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn-icon btn-ghost p-1 text-danger"
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
