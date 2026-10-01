'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  List,
  TableProperties,
  ArrowUpDown,
  Download,
  Filter,
  X,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import QuestionsTable from '@/components/QuestionsTable';
import SpreadsheetTable from '@/components/SpreadsheetTable';
import QuestionCard from '@/components/QuestionCard';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImportExportModal from '@/components/ImportExportModal';
import { openAddModal, openEditModal } from '@/lib/events';
import { isDueToday, isOverdue, sortQuestions, getNextRevision } from '@/lib/dates';
import {
  COMMON_TOPICS,
  type QuestionStatus,
  type SortOption,
} from '@/lib/types';

type FilterType = 'all' | 'dueToday' | 'overdue' | 'upcoming' | QuestionStatus;
type ViewMode = 'modern' | 'spreadsheet';

export default function QuestionsPage() {
  const { questions, recordsMap, isLoaded, deleteQuestion } = useQuestions();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('modern');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  // Available topics in questions
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set).sort();
  }, [questions]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading questions...</p>
      </div>
    );
  }

  // Filtering
  const filtered = questions.filter((q) => {
    // Search by question name
    if (search.trim()) {
      if (!q.questionName.toLowerCase().includes(search.toLowerCase().trim())) {
        return false;
      }
    }

    // Filter by topic
    if (topicFilter !== 'all') {
      if (q.topic !== topicFilter) return false;
    }

    // Filter by status / due / overdue / upcoming
    if (filterType === 'dueToday') {
      if (!isDueToday(q, recordsMap)) return false;
    } else if (filterType === 'overdue') {
      if (!isOverdue(q, recordsMap)) return false;
    } else if (filterType === 'upcoming') {
      const next = getNextRevision(q, recordsMap);
      if (!next || next.daysUntil <= 0) return false;
    } else if (filterType !== 'all') {
      if (q.status !== filterType) return false;
    }

    // Filter by date range (dateSolved)
    if (startDate && q.dateSolved < startDate) return false;
    if (endDate && q.dateSolved > endDate) return false;

    return true;
  });

  // Sorting
  const sorted = sortQuestions(filtered, sortBy, recordsMap);

  const questionToDelete = deleteId
    ? questions.find((q) => q.id === deleteId)
    : null;

  const handleDelete = () => {
    if (deleteId) {
      deleteQuestion(deleteId);
      setDeleteId(null);
    }
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    filterType !== 'all' ||
    topicFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '' ||
    sortBy !== 'default';

  const resetFilters = () => {
    setSearch('');
    setFilterType('all');
    setTopicFilter('all');
    setStartDate('');
    setEndDate('');
    setSortBy('default');
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Question Tracker</h1>
          <p className="text-xs text-text-muted">
            {questions.length} total question{questions.length !== 1 ? 's' : ''} tracked
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="hide-mobile flex items-center rounded-lg border border-border bg-surface p-1">
            <button
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'modern'
                  ? 'bg-primary text-white shadow-none'
                  : 'text-text-muted hover:text-text'
              }`}
              onClick={() => setViewMode('modern')}
              title="Modern Table with Progress and Next Revision"
            >
              <List size={13} />
              Modern Table
            </button>
            <button
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'spreadsheet'
                  ? 'bg-primary text-white shadow-none'
                  : 'text-text-muted hover:text-text'
              }`}
              onClick={() => setViewMode('spreadsheet')}
              title="Original Excel Spreadsheet View with all 6 intervals"
            >
              <TableProperties size={13} />
              Excel View
            </button>
          </div>

          {/* Backup / Export */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setBackupModalOpen(true)}
            title="Import or Export Tracker Data"
          >
            <Download size={14} />
            <span className="hide-mobile">Backup / Export</span>
          </button>

          {/* Add Question */}
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={15} />
            Add Question
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {questions.length > 0 && (
        <div className="card p-3 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                className="input pl-9 text-xs h-9"
                placeholder="Search questions by name (e.g. 'binary', 'tree')..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  onClick={() => setSearch('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status / Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted hide-mobile">Filter:</span>
                <select
                  className="select text-xs py-1 px-2.5 h-9 w-auto min-w-[130px]"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                >
                  <option value="all">All Statuses</option>
                  <option value="dueToday">Due Today</option>
                  <option value="overdue">Overdue</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Topic Filter */}
              {(availableTopics.length > 0 || COMMON_TOPICS.length > 0) && (
                <select
                  className="select text-xs py-1 px-2.5 h-9 w-auto min-w-[120px]"
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                >
                  <option value="all">All Topics</option>
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={13} className="text-text-muted hide-mobile" />
                <select
                  className="select text-xs py-1 px-2.5 h-9 w-auto min-w-[140px]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="default">Default Priority</option>
                  <option value="name-asc">Name (A → Z)</option>
                  <option value="name-desc">Name (Z → A)</option>
                  <option value="date-newest">Solved (Newest)</option>
                  <option value="date-oldest">Solved (Oldest)</option>
                  <option value="next-revision">Next Revision</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date range row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-text-muted font-medium">Solved Between:</span>
              <input
                type="date"
                className="input py-1 px-2 h-7 text-xs w-auto"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
              />
              <span className="text-text-muted">to</span>
              <input
                type="date"
                className="input py-1 px-2 h-7 text-xs w-auto"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
              />
            </div>

            {hasActiveFilters && (
              <button
                className="text-xs text-primary hover:underline flex items-center gap-1"
                onClick={resetFilters}
              >
                <X size={12} />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {questions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<List size={40} />}
            title="No questions yet"
            description="Start building your spaced repetition schedule. Add your first DSA question with its solved date."
            action={
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                <Plus size={15} />
                Add Your First Question
              </button>
            }
          />
        </div>
      ) : sorted.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Filter size={40} />}
            title="No matching questions"
            description="No questions match your current search, topic, or date filters."
            action={
              <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                Reset All Filters
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Mobile view switch header */}
          <div className="show-mobile-only flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-text">
              Showing {sorted.length} question{sorted.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center rounded border border-border bg-surface p-0.5">
              <button
                className={`px-2 py-0.5 text-xs font-semibold ${
                  viewMode === 'modern' ? 'bg-primary text-white rounded' : 'text-text-muted'
                }`}
                onClick={() => setViewMode('modern')}
              >
                Cards
              </button>
              <button
                className={`px-2 py-0.5 text-xs font-semibold ${
                  viewMode === 'spreadsheet' ? 'bg-primary text-white rounded' : 'text-text-muted'
                }`}
                onClick={() => setViewMode('spreadsheet')}
              >
                Excel Grid
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hide-mobile">
            {viewMode === 'modern' ? (
              <QuestionsTable
                questions={sorted}
                recordsMap={recordsMap}
                onEdit={openEditModal}
                onDelete={setDeleteId}
              />
            ) : (
              <SpreadsheetTable
                questions={sorted}
                recordsMap={recordsMap}
                onEdit={openEditModal}
                onDelete={setDeleteId}
              />
            )}
          </div>

          {/* Mobile View: Cards or Horizontal Spreadsheet */}
          <div className="show-mobile-only">
            {viewMode === 'modern' ? (
              <div className="space-y-3">
                {sorted.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    recordsMap={recordsMap}
                    onEdit={openEditModal}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            ) : (
              <SpreadsheetTable
                questions={sorted}
                recordsMap={recordsMap}
                onEdit={openEditModal}
                onDelete={setDeleteId}
              />
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Question"
        message={
          questionToDelete
            ? `Are you sure you want to delete "${questionToDelete.questionName}"? This will permanently delete the question and its revision history.`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Import / Export Backup Modal */}
      <ImportExportModal
        open={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />
    </div>
  );
}
