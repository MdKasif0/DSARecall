'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { DSAQuestion } from '@/lib/types';
import { REVISION_INTERVALS, REVISION_KEYS, REVISION_LABELS } from '@/lib/types';
import { formatDateDisplay, isToday, isPast } from '@/lib/dates';
import StatusBadge from './StatusBadge';

interface QuestionCardProps {
  question: DSAQuestion;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function QuestionCard({ question, onEdit, onDelete }: QuestionCardProps) {
  return (
    <div className="card card-hover p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text truncate">
            {question.questionName}
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Solved: {formatDateDisplay(question.dateSolved)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge status={question.status} />
        </div>
      </div>

      {/* Revision dates grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {REVISION_INTERVALS.map((interval) => {
          const key = REVISION_KEYS[interval];
          const dateStr = question[key];
          const today = isToday(dateStr);
          const past = isPast(dateStr);
          return (
            <div
              key={interval}
              className={`flex items-center justify-between rounded px-2 py-1.5 text-xs ${
                today
                  ? 'bg-primary-light font-semibold text-primary'
                  : past
                    ? 'bg-danger-light text-danger'
                    : 'bg-bg text-text-muted'
              }`}
            >
              <span>{REVISION_LABELS[interval]}</span>
              <span className="font-medium">
                {formatDateDisplay(dateStr).replace(/, \d{4}$/, '')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onEdit(question.id)}
          aria-label={`Edit ${question.questionName}`}
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          className="btn btn-ghost btn-sm text-danger"
          onClick={() => onDelete(question.id)}
          aria-label={`Delete ${question.questionName}`}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
