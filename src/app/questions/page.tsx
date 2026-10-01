'use client';

import { useState } from 'react';
import { Plus, Search, List, Filter } from 'lucide-react';
import { useQuestions } from '@/lib/context';
import QuestionsTable from '@/components/QuestionsTable';
import QuestionCard from '@/components/QuestionCard';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import { openAddModal, openEditModal } from '@/lib/events';
import { isDueToday, isOverdue } from '@/lib/dates';
import type { QuestionStatus } from '@/lib/types';

type FilterType = 'all' | 'dueToday' | 'overdue' | QuestionStatus;

export default function QuestionsPage() {
  const { questions, recordsMap, isLoaded, deleteQuestion } = useQuestions();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading questions...</p>
      </div>
    );
  }

  // Filter questions
  let filtered = questions;

  if (search.trim()) {
    filtered = filtered.filter((q) =>
      q.questionName.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (filterType === 'dueToday') {
    filtered = filtered.filter((q) => isDueToday(q, recordsMap));
  } else if (filterType === 'overdue') {
    filtered = filtered.filter((q) => isOverdue(q, recordsMap));
  } else if (filterType !== 'all') {
    filtered = filtered.filter((q) => q.status === filterType);
  }

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
            Original spreadsheet view: {questions.length} tracked problem{questions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={15} />
          Add Question
        </button>
      </div>

      {/* Search & Filter Bar */}
      {questions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              className="input pl-9 text-xs"
              placeholder="Search by question name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-text-muted flex items-center gap-1">
              <Filter size={13} />
              Filter:
            </span>
            <select
              className="select text-xs py-1.5 px-2.5 h-8 w-auto min-w-[140px]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
            >
              <option value="all">All ({questions.length})</option>
              <option value="dueToday">Due Today</option>
              <option value="overdue">Has Overdue</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
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
            description={`No questions matching your search or active filter.`}
            action={
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setFilterType('all');
                }}
              >
                Reset Filters
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table matching original Excel layout */}
          <div className="hide-mobile">
            <QuestionsTable
              questions={filtered}
              recordsMap={recordsMap}
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
                recordsMap={recordsMap}
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
