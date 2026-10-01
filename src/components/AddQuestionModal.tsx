'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, CalendarDays } from 'lucide-react';
import { calculateRevisionDates, formatDateDisplay, getTodayISO } from '@/lib/dates';
import { useQuestions } from '@/lib/context';
import type { QuestionStatus } from '@/lib/types';
import { REVISION_LABELS, REVISION_INTERVALS, REVISION_KEYS } from '@/lib/types';

interface AddQuestionModalProps {
  open: boolean;
  onClose: () => void;
  /** If set, the modal will edit this question instead of creating a new one */
  editId?: string | null;
}

export default function AddQuestionModal({ open, onClose, editId }: AddQuestionModalProps) {
  const { questions, addQuestion, updateQuestion } = useQuestions();

  const [name, setName] = useState('');
  const [dateSolved, setDateSolved] = useState(getTodayISO());
  const [status, setStatus] = useState<QuestionStatus>('Pending');

  const isEditing = !!editId;

  // Pre-fill when editing
  useEffect(() => {
    if (editId) {
      const q = questions.find((q) => q.id === editId);
      if (q) {
        setName(q.questionName);
        setDateSolved(q.dateSolved);
        setStatus(q.status);
      }
    } else {
      setName('');
      setDateSolved(getTodayISO());
      setStatus('Pending');
    }
  }, [editId, questions, open]);

  if (!open) return null;

  const preview = dateSolved ? calculateRevisionDates(dateSolved) : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dateSolved) return;

    if (isEditing && editId) {
      updateQuestion(editId, {
        questionName: name.trim(),
        dateSolved,
        status,
      });
    } else {
      addQuestion(name.trim(), dateSolved, status);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-text">
            {isEditing ? 'Edit Question' : 'Add Question'}
          </h2>
          <button
            className="btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            {/* Question Name */}
            <div>
              <label htmlFor="question-name" className="label">
                Question Name
              </label>
              <input
                id="question-name"
                type="text"
                className="input"
                placeholder="e.g., Two Sum, Binary Search Tree"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Date Solved */}
            <div>
              <label htmlFor="date-solved" className="label">
                Date Solved
              </label>
              <input
                id="date-solved"
                type="date"
                className="input"
                value={dateSolved}
                onChange={(e) => setDateSolved(e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="question-status" className="label">
                Status
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

            {/* Revision Schedule Preview */}
            {preview && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-primary" />
                  <span className="text-sm font-medium text-text">
                    Revision Schedule
                  </span>
                </div>
                <div className="space-y-1.5">
                  {REVISION_INTERVALS.map((interval) => {
                    const key = REVISION_KEYS[interval];
                    return (
                      <div key={interval} className="revision-pill">
                        <span className="revision-pill-label">
                          {REVISION_LABELS[interval]}
                        </span>
                        <span className="revision-pill-date">
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
    </div>
  );
}
