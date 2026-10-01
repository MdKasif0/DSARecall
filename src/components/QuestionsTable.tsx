'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import type { DSAQuestion, RevisionRecord } from '@/lib/types';
import { formatDateDisplay } from '@/lib/dates';
import StatusBadge from './StatusBadge';
import RevisionCell from './RevisionCell';

interface QuestionsTableProps {
  questions: DSAQuestion[];
  recordsMap?: Map<string, RevisionRecord>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function QuestionsTable({
  questions,
  recordsMap,
  onEdit,
  onDelete,
}: QuestionsTableProps) {
  const isDone = (qId: string, interval: number) => {
    if (!recordsMap) return false;
    return recordsMap.get(`${qId}_${interval}`)?.completed === true;
  };

  return (
    <div className="table-container card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Date Solved</th>
            <th>+3 Days</th>
            <th>+7 Days</th>
            <th>+15 Days</th>
            <th>+30 Days</th>
            <th>+60 Days</th>
            <th>+120 Days</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td className="font-medium text-text max-w-[220px]">
                <Link
                  href={`/questions/${q.id}`}
                  className="font-medium text-text hover:text-primary transition-colors no-underline block truncate"
                  title={q.questionName}
                >
                  {q.questionName}
                </Link>
              </td>
              <td className="text-text-muted">{formatDateDisplay(q.dateSolved)}</td>
              <td>
                <RevisionCell
                  dateStr={q.revision3}
                  isCompleted={isDone(q.id, 3)}
                />
              </td>
              <td>
                <RevisionCell
                  dateStr={q.revision7}
                  isCompleted={isDone(q.id, 7)}
                />
              </td>
              <td>
                <RevisionCell
                  dateStr={q.revision15}
                  isCompleted={isDone(q.id, 15)}
                />
              </td>
              <td>
                <RevisionCell
                  dateStr={q.revision30}
                  isCompleted={isDone(q.id, 30)}
                />
              </td>
              <td>
                <RevisionCell
                  dateStr={q.revision60}
                  isCompleted={isDone(q.id, 60)}
                />
              </td>
              <td>
                <RevisionCell
                  dateStr={q.revision120}
                  isCompleted={isDone(q.id, 120)}
                />
              </td>
              <td>
                <StatusBadge status={q.status} />
              </td>
              <td>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-icon btn-ghost"
                    onClick={() => onEdit(q.id)}
                    aria-label={`Edit ${q.questionName}`}
                    title="Edit Question"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn-icon btn-ghost text-danger"
                    onClick={() => onDelete(q.id)}
                    aria-label={`Delete ${q.questionName}`}
                    title="Delete Question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
