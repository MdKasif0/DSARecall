'use client';

import { useState } from 'react';
import { Plus, Search, List } from 'lucide-react';
import { useQuestions } from '@/lib/context';
import QuestionsTable from '@/components/QuestionsTable';
import QuestionCard from '@/components/QuestionCard';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import { openAddModal, openEditModal } from '@/lib/events';

export default function QuestionsPage() {
  const { questions, isLoaded, deleteQuestion } = useQuestions();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  const filtered = search.trim()
    ? questions.filter((q) =>
        q.questionName.toLowerCase().includes(search.toLowerCase())
      )
    : questions;

  const questionToDelete = deleteId
    ? questions.find((q) => q.id === deleteId)
    : null;

  const handleDelete = () => {
    if (deleteId) {
      deleteQuestion(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">All Questions</h1>
          <p className="text-sm text-text-muted">
            {questions.length} question{questions.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={15} />
          Add Question
        </button>
      </div>

      {/* Search */}
      {questions.length > 0 && (
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Content */}
      {questions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<List size={40} />}
            title="No questions yet"
            description="Start tracking your DSA questions. Add your first question to see it here with auto-generated revision dates."
            action={
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                <Plus size={15} />
                Add Your First Question
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Search size={40} />}
            title="No matches found"
            description={`No questions matching "${search}". Try a different search term.`}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hide-mobile">
            <QuestionsTable
              questions={filtered}
              onEdit={openEditModal}
              onDelete={setDeleteId}
            />
          </div>

          {/* Mobile cards */}
          <div className="show-mobile-only space-y-3">
            {filtered.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onEdit={openEditModal}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Question"
        message={
          questionToDelete
            ? `Are you sure you want to delete "${questionToDelete.questionName}"? This action cannot be undone.`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
