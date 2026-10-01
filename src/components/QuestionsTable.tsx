'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { DSAQuestion } from '@/lib/types';
import { formatDateDisplay } from '@/lib/dates';
import StatusBadge from './StatusBadge';
import RevisionCell from './RevisionCell';

interface QuestionsTableProps {
  questions: DSAQuestion[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function QuestionsTable({ questions, onEdit, onDelete }: QuestionsTableProps) {
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
              <td className="font-medium text-text max-w-[200px] truncate">
                {q.questionName}
              </td>
              <td>{formatDateDisplay(q.dateSolved)}</td>
              <td><RevisionCell dateStr={q.revision3} /></td>
              <td><RevisionCell dateStr={q.revision7} /></td>
              <td><RevisionCell dateStr={q.revision15} /></td>
              <td><RevisionCell dateStr={q.revision30} /></td>
              <td><RevisionCell dateStr={q.revision60} /></td>
              <td><RevisionCell dateStr={q.revision120} /></td>
              <td><StatusBadge status={q.status} /></td>
              <td>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-icon btn-ghost"
                    onClick={() => onEdit(q.id)}
                    aria-label={`Edit ${q.questionName}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn-icon btn-ghost text-danger"
                    onClick={() => onDelete(q.id)}
                    aria-label={`Delete ${q.questionName}`}
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
