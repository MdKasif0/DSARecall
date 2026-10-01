'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, CalendarDays, AlertCircle, Clock } from 'lucide-react';
import { calculateRevisionDates, formatDateDisplay, formatDateShort, getTodayISO } from '@/lib/dates';
import { useQuestions } from '@/lib/context';
import type { QuestionStatus, QuestionDifficulty, QuestionPriority } from '@/lib/types';
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
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(
    questionToEdit?.difficulty ?? 'Medium'
  );
  const [priority, setPriority] = useState<QuestionPriority>(
    questionToEdit?.priority ?? 'Medium'
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
        difficulty,
        priority,
      });
    } else {
      addQuestion(trimmedName, dateSolved, status, resolvedTopic, difficulty, priority);
    }

    onClose();
  };

  return (
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {/* Header matching Section 23 */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4.5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-text">
            {isEditing ? 'Edit Question' : 'Add Question'}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            DSA spaced-repetition tracker
          </p>
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-[#F1E9DE] hover:text-text transition-colors"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={17} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[#F4E4DF] border border-[#E6D0CA] p-3 text-xs text-[#A65D50]">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Name */}
        <div>
          <label htmlFor="question-name" className="label text-xs font-bold text-text mb-1">
            Question Name <span className="text-[#A65D50]">*</span>
          </label>
          <input
            id="question-name"
            type="text"
            className="input text-sm"
            placeholder="e.g. Binary Search, Trapping Rain Water, Course Schedule"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
            required
          />
        </div>

        {/* Topic and Date Solved */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Topic */}
          <div>
            <label htmlFor="question-topic" className="label text-xs font-bold text-text mb-1">
              Topic
            </label>
            <select
              id="question-topic"
              className="select text-xs"
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

          {/* Date Solved */}
          <div>
            <label htmlFor="date-solved" className="label text-xs font-bold text-text mb-1">
              Date Solved <span className="text-[#A65D50]">*</span>
            </label>
            <input
              id="date-solved"
              type="date"
              className="input text-xs"
              value={dateSolved}
              onChange={(e) => {
                setDateSolved(e.target.value);
                if (error) setError(null);
              }}
              required
            />
          </div>
        </div>

        {/* Custom topic if "Other" */}
        {topic === 'Other' && (
          <div>
            <label htmlFor="custom-topic" className="label text-xs font-bold text-text mb-1">
              Custom Topic Name
            </label>
            <input
              id="custom-topic"
              type="text"
              className="input text-xs"
              placeholder="e.g. Disjoint Set Union, Segment Tree"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
            />
          </div>
        )}

        {/* Difficulty and Priority matching Section 23 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="question-diff" className="label text-xs font-bold text-text mb-1">
              Difficulty
            </label>
            <select
              id="question-diff"
              className="select text-xs"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label htmlFor="question-prio" className="label text-xs font-bold text-text mb-1">
              Priority
            </label>
            <select
              id="question-prio"
              className="select text-xs"
              value={priority}
              onChange={(e) => setPriority(e.target.value as QuestionPriority)}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {dateChanged && (
          <p className="text-xs text-[#795B39] bg-[#EDE1CF] rounded-md p-2.5 border border-[#DFD1BC]">
            Notice: Modifying the solved date automatically recalculates all revision dates (+3, +7, +15, +30, +60, +120 days).
          </p>
        )}

        {/* Timeline Preview: "Your Revision Schedule" matching Section 23 */}
        {preview && (
          <div className="rounded-lg border border-border bg-[#FAF7F2] p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text">
              <Clock size={14} className="text-[#8B6F47]" />
              <span>Your Revision Schedule</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REVISION_INTERVALS.map((interval) => {
                const key = REVISION_KEYS[interval];
                const dateVal = preview[key];
                return (
                  <div
                    key={interval}
                    className="rounded-md bg-white border border-[#E4DDD2] p-2 flex flex-col gap-0.5 shadow-xs"
                  >
                    <span className="text-[0.6875rem] font-bold text-[#8B6F47]">
                      {REVISION_LABELS[interval]}
                    </span>
                    <span className="text-xs font-bold text-[#29251F]">
                      {formatDateShort(dateVal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-2 border-t border-border">
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
            {isEditing ? 'Save Changes' : 'Add to Recall'}
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
