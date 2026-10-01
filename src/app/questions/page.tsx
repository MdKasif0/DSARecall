'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  List,
  TableProperties,
  Download,
  Filter,
  X,
  FileText,
  Calendar,
  Clock,
  Flame,
  PieChart,
  CalendarDays,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import QuestionsTable from '@/components/QuestionsTable';
import SpreadsheetTable from '@/components/SpreadsheetTable';
import QuestionCard from '@/components/QuestionCard';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImportExportModal from '@/components/ImportExportModal';
import RevisionHeatmap from '@/components/RevisionHeatmap';
import ActivityChart from '@/components/ActivityChart';
import StatCard from '@/components/StatCard';
import TopBar from '@/components/TopBar';
import { openAddModal, openEditModal } from '@/lib/events';
import { isDueToday, isOverdue, sortQuestions, getNextRevision, getTodayISO } from '@/lib/dates';
import { computeActivityStats } from '@/lib/analytics';
import {
  COMMON_TOPICS,
  REVISION_INTERVALS,
  REVISION_KEYS,
  type QuestionStatus,
  type SortOption,
} from '@/lib/types';

type FilterType = 'all' | 'dueToday' | 'overdue' | 'upcoming' | QuestionStatus;
type ViewMode = 'modern' | 'spreadsheet';

export default function QuestionsPage() {
  const { questions, records, recordsMap, isLoaded, deleteQuestion } = useQuestions();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('modern');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

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

  // Compute analytics stats for heatmap and chart
  const stats = useMemo(() => {
    return computeActivityStats(records, questions);
  }, [records, questions]);

  // Metrics
  const today = getTodayISO();
  let dueTodayCount = 0;
  let overdueCount = 0;
  let completedCount = 0;
  const totalPossible = questions.length * 6;

  for (const q of questions) {
    let qDone = 0;
    for (const interval of REVISION_INTERVALS) {
      const rec = recordsMap.get(`${q.id}_${interval}`);
      if (rec?.completed) {
        completedCount++;
        qDone++;
        continue;
      }
      const d = q[REVISION_KEYS[interval]];
      if (d === today) {
        dueTodayCount++;
      } else if (d < today) {
        overdueCount++;
      }
    }
    if (qDone === 6) {
      // fully completed
    }
  }

  const completionPct =
    totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;
  const avgRevisions = questions.length > 0 ? (completedCount / questions.length).toFixed(1) : '0';

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
    setDateRangeOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Breadcrumb and Profile */}
      <TopBar onSearchClick={() => document.getElementById('search-input')?.focus()} />

      {/* Editorial Header matching Screenshot */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Question Tracker
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Keep your solved problems organized and know exactly what to revise next.
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {questions.length} question{questions.length !== 1 ? 's' : ''} tracked
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start">
          {/* Segmented View Mode Toggle */}
          <div className="flex p-1 bg-slate-200/50 backdrop-blur-md border border-white/70 rounded-xl gap-0.5">
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'modern'
                  ? 'bg-white text-slate-900 shadow-sm border border-white/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setViewMode('modern')}
              title="Modern Table with Progress and Next Revision"
            >
              <List size={14} />
              <span>Modern Table</span>
            </button>

            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'spreadsheet'
                  ? 'bg-white text-slate-900 shadow-sm border border-white/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setViewMode('spreadsheet')}
              title="Original Excel Spreadsheet View with all 6 intervals"
            >
              <TableProperties size={14} />
              <span>Excel View</span>
            </button>
          </div>

          {/* Backup / Export */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setBackupModalOpen(true)}
            title="Import or Export Tracker Data"
          >
            <Download size={14} />
            <span>Backup / Export</span>
          </button>

          {/* Add Question */}
          <button
            className="btn btn-primary btn-sm"
            onClick={openAddModal}
            title="Add a new solved DSA problem"
          >
            <Plus size={15} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Questions"
          value={questions.length}
          icon={<FileText size={18} />}
          trend="↑ +2 this month"
          trendType="success"
        />
        <StatCard
          label="Due Today"
          value={dueTodayCount}
          icon={<Calendar size={18} />}
          trend={dueTodayCount > 0 ? 'Keep going!' : 'All caught up!'}
          trendType={dueTodayCount > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={<Clock size={18} />}
          trend={overdueCount > 0 ? `${overdueCount} need review` : 'All clear!'}
          trendType={overdueCount > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Current Streak"
          value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`}
          icon={<Flame size={18} />}
          trend={`${stats.longestStreak} days longest`}
          trendType="neutral"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionPct}%`}
          icon={<PieChart size={18} />}
          trend={`${avgRevisions} / 6 avg. revisions`}
          trendType="neutral"
        />
      </div>

      {/* Revision Activity Heatmap & 30-Day Activity Chart Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Heatmap & Streak Summary (7 cols on large screens) */}
        <div className="lg:col-span-7">
          <RevisionHeatmap stats={stats} />
        </div>

        {/* 30-Day Timeline Chart (5 cols on large screens) */}
        <div className="lg:col-span-5">
          <ActivityChart data={stats.last30Days} />
        </div>
      </div>

      {/* Compact Single-Line Liquid Glass Filter Toolbar */}
      <div className="card-glass p-3.5 rounded-2xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              id="search-input"
              type="text"
              className="input pl-9 pr-8 text-xs h-9 bg-white/70 backdrop-blur-md border border-white/80 focus:bg-white rounded-xl shadow-xs"
              placeholder='Search questions by name (e.g. "binary", "tree")...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              className="select text-xs py-1 px-2.5 h-9 w-auto min-w-[125px] bg-white/70 backdrop-blur-md border border-white/80 rounded-xl shadow-xs"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="dueToday">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Topic Filter */}
            <select
              className="select text-xs py-1 px-2.5 h-9 w-auto min-w-[120px] bg-white/70 backdrop-blur-md border border-white/80 rounded-xl shadow-xs"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              aria-label="Filter by topic"
            >
              <option value="all">All Topics</option>
              {availableTopics.length > 0
                ? availableTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                : COMMON_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
            </select>

            {/* Priority / Sort By */}
            <select
              className="select text-xs py-1 px-2.5 h-9 w-auto min-w-[135px] bg-white/70 backdrop-blur-md border border-white/80 rounded-xl shadow-xs"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort order"
            >
              <option value="default">Default Priority</option>
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="date-newest">Solved (Newest)</option>
              <option value="date-oldest">Solved (Oldest)</option>
              <option value="next-revision">Next Revision</option>
              <option value="status">Status</option>
            </select>

            {/* Solved Between Date Button / Dropdown Toggle */}
            <button
              className={`btn btn-secondary btn-sm h-9 text-xs px-2.5 rounded-xl ${
                startDate || endDate ? 'border-emerald-500/40 text-emerald-800 bg-emerald-500/10' : ''
              }`}
              onClick={() => setDateRangeOpen(!dateRangeOpen)}
              title="Filter by Solved Date"
            >
              <CalendarDays size={13} className="text-slate-500" />
              <span>
                {startDate || endDate
                  ? `${startDate || 'Start'} → ${endDate || 'End'}`
                  : 'Solved Between'}
              </span>
            </button>

            {/* Reset Filters if Active */}
            {hasActiveFilters && (
              <button
                className="btn btn-ghost btn-sm h-9 text-xs text-rose-700 hover:bg-rose-500/10 px-2.5 rounded-xl flex items-center gap-1 font-semibold"
                onClick={resetFilters}
                title="Reset all filters"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Date Range Input Row */}
        {dateRangeOpen && (
          <div className="mt-3 pt-3 border-t border-white/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-600 font-semibold">Solved Between:</span>
            <input
              type="date"
              className="input py-1 px-2 h-7.5 text-xs w-auto bg-white/80 rounded-lg border-white/90 shadow-xs"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              className="input py-1 px-2 h-7.5 text-xs w-auto bg-white/80 rounded-lg border-white/90 shadow-xs"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
            />
            {(startDate || endDate) && (
              <button
                className="text-xs text-slate-500 hover:text-slate-900 ml-1 font-medium"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear date range
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {questions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<List size={40} />}
            title="Start your revision journey"
            description="Add your first solved DSA problem and DSA Recall will automatically build your 3, 7, 15, 30, 60 and 120-day revision schedule."
            action={
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                <Plus size={15} />
                Add Question
              </button>
            }
          />
        </div>
      ) : sorted.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Filter size={40} />}
            title="No questions match your search"
            description="Try adjusting your search query, status, or date filters."
            action={
              <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                Reset All Filters
              </button>
            }
          />
        </div>
      ) : (
        <>
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
