'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, CalendarDays, AlertCircle } from 'lucide-react';
import { calculateRevisionDates, formatDateDisplay, getTodayISO } from '@/lib/dates';
import { useQuestions } from '@/lib/context';
import type { QuestionStatus } from '@/lib/types';
import {
  REVISION_LABELS,
  REVISION_INTERVALS,
  REVISION_KEYS,
  COMMON_TOPICS,
} from '@/lib/types';

interface AddQuestionModalProps {
  open: boolean;
  onClose: () => void;
  editId?: string | null;
}

function AddQuestionForm({
  editId,
  onClose,
}: {
  editId?: string | null;
  onClose: () => void;
}) {
  const { questions, addQuestion, updateQuestion } = useQuestions();

  const questionToEdit = editId ? questions.find((q) => q.id === editId) : null;
  const isEditing = !!questionToEdit;

  const [name, setName] = useState(questionToEdit?.questionName ?? '');
  const [topic, setTopic] = useState(questionToEdit?.topic ?? 'Arrays');
  const [customTopic, setCustomTopic] = useState('');
  const [dateSolved, setDateSolved] = useState(
    questionToEdit?.dateSolved ?? getTodayISO()
  );
  const [status, setStatus] = useState<QuestionStatus>(
    questionToEdit?.status ?? 'Pending'
  );
  const [error, setError] = useState<string | null>(null);

  const preview = dateSolved && /^\d{4}-\d{2}-\d{2}$/.test(dateSolved)
    ? calculateRevisionDates(dateSolved)
    : null;

  const dateChanged = isEditing && questionToEdit && dateSolved !== questionToEdit.dateSolved;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    // Validation
    if (!trimmedName) {
      setError('Question name cannot be empty.');
      return;
    }

    if (!dateSolved) {
      setError('Date solved is required.');
      return;
    }

    const resolvedTopic = topic === 'Other' && customTopic.trim() ? customTopic.trim() : topic;

    if (isEditing && editId) {
      updateQuestion(editId, {
        questionName: trimmedName,
        dateSolved,
        status,
        topic: resolvedTopic,
      });
    } else {
      addQuestion(trimmedName, dateSolved, status, resolvedTopic);
    }

    onClose();
  };

  return (
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-text">
          {isEditing ? 'Edit Question' : 'Add DSA Question'}
        </h2>
        <button
          className="btn-icon btn-ghost"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-light p-3 text-xs text-danger">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question Name */}
          <div>
            <label htmlFor="question-name" className="label">
              Question Name <span className="text-danger">*</span>
            </label>
            <input
              id="question-name"
              type="text"
              className="input"
              placeholder="e.g., Two Sum, LRU Cache, Course Schedule"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              required
            />
          </div>

          {/* Topic / Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="question-topic" className="label">
                Topic / Category
              </label>
              <select
                id="question-topic"
                className="select"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                {COMMON_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="question-status" className="label">
                Initial Status
              </label>
              <select
                id="question-status"
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as QuestionStatus)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Custom topic if "Other" is selected */}
          {topic === 'Other' && (
            <div>
              <label htmlFor="custom-topic" className="label">
                Custom Topic Name
              </label>
              <input
                id="custom-topic"
                type="text"
                className="input"
                placeholder="e.g., Segment Trees, Tries"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
            </div>
          )}

          {/* Date Solved */}
          <div>
            <label htmlFor="date-solved" className="label">
              Date Solved <span className="text-danger">*</span>
            </label>
            <input
              id="date-solved"
              type="date"
              className="input"
              value={dateSolved}
              onChange={(e) => {
                setDateSolved(e.target.value);
                if (error) setError(null);
              }}
              required
            />
            {dateChanged && (
              <p className="mt-1 text-xs text-amber-700 bg-amber-50 rounded p-1.5 border border-amber-200">
                Notice: Changing the solved date will automatically recalculate all 6 revision dates (+3, +7, +15, +30, +60, +120 days).
              </p>
            )}
          </div>

          {/* Revision Schedule Preview */}
          {preview && (
            <div className="rounded-lg border border-border bg-slate-50/50 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <CalendarDays size={14} className="text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text">
                  Auto-Generated Revision Dates
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {REVISION_INTERVALS.map((interval) => {
                  const key = REVISION_KEYS[interval];
                  return (
                    <div
                      key={interval}
                      className="rounded bg-white border border-border p-2 flex flex-col gap-0.5"
                    >
                      <span className="text-[0.6875rem] font-semibold text-text-muted">
                        {REVISION_LABELS[interval]}
                      </span>
                      <span className="text-xs font-bold text-text">
                        {formatDateDisplay(preview[key])}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!name.trim() || !dateSolved}
          >
            {isEditing ? 'Save Changes' : 'Add Question'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddQuestionModal({
  open,
  onClose,
  editId,
}: AddQuestionModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editId ? 'Edit Question' : 'Add Question'}
    >
      <AddQuestionForm
        key={editId ?? 'new'}
        editId={editId}
        onClose={onClose}
      />
    </div>
  );
}
