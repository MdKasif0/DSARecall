'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Search,
  X,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
  formatDateDisplay,
  formatDateShort,
  getDaysUntilRevision,
  isCheckpointCompleted,
} from '@/lib/dates';
import {
  REVISION_INTERVALS,
  REVISION_KEYS,
  REVISION_LABELS,
  type RevisionInterval,
  type DSAQuestion,
} from '@/lib/types';
import EmptyState from '@/components/EmptyState';
import TopBar from '@/components/TopBar';
import { openAddModal } from '@/lib/events';

interface UpcomingRevision {
  question: DSAQuestion;
  interval: RevisionInterval;
  scheduledDate: string;
  daysUntil: number;
}

type TimeframeFilter = 'all' | '7days' | '30days';

export default function RevisionsPage() {
  const { questions, recordsMap, isLoaded, markRevision } = useQuestions();
  const [filter, setFilter] = useState<TimeframeFilter>('all');
  const [search, setSearch] = useState('');

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading revisions...</p>
      </div>
    );
  }

  // Gather all future uncompleted revisions
  const allUpcoming: UpcomingRevision[] = [];

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const scheduledDate = q[REVISION_KEYS[interval]];
      const daysUntil = getDaysUntilRevision(scheduledDate);

      // Strictly future items
      if (daysUntil > 0) {
        allUpcoming.push({
          question: q,
          interval,
          scheduledDate,
          daysUntil,
        });
      }
    }
  }

  // Sort by date ascending
  allUpcoming.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  // Filter by timeframe
  let filtered = allUpcoming;
  if (filter === '7days') {
    filtered = filtered.filter((item) => item.daysUntil <= 7);
  } else if (filter === '30days') {
    filtered = filtered.filter((item) => item.daysUntil <= 30);
  }

  // Filter by search
  if (search.trim()) {
    filtered = filtered.filter((item) =>
      item.question.questionName.toLowerCase().includes(search.toLowerCase().trim())
    );
  }

  // Group by Date for calendar schedule matching Section 20
  const dateGroupsMap = new Map<string, UpcomingRevision[]>();
  for (const item of filtered) {
    const list = dateGroupsMap.get(item.scheduledDate) || [];
    list.push(item);
    dateGroupsMap.set(item.scheduledDate, list);
  }

  const dateGroups = Array.from(dateGroupsMap.entries()).map(([dateStr, items]) => {
    const daysUntil = items[0].daysUntil;
    let label = formatDateDisplay(dateStr);
    if (daysUntil === 1) {
      label = 'Tomorrow';
    } else {
      label = formatDateShort(dateStr);
    }
    return {
      dateStr,
      daysUntil,
      label,
      items,
      count: items.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Bar with Breadcrumb and Profile */}
      <TopBar />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Upcoming Schedule
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {allUpcoming.length} future checkpoint{allUpcoming.length !== 1 ? 's' : ''} across your tracked problems.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/today" className="btn btn-secondary btn-sm no-underline">
            <span>Check Today</span>
            <ArrowRight size={14} />
          </Link>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={15} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Timeframe segmented pills + Search */}
      <div className="card-glass p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-white/80 shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-200/50 backdrop-blur-md border border-white/70 rounded-xl self-start">
          <button
            className={`btn btn-sm ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-sm border border-white/90 font-bold'
                : 'btn-ghost text-slate-600 font-semibold'
            }`}
            onClick={() => setFilter('all')}
          >
            All Upcoming ({allUpcoming.length})
          </button>
          <button
            className={`btn btn-sm ${
              filter === '7days'
                ? 'bg-white text-slate-900 shadow-sm border border-white/90 font-bold'
                : 'btn-ghost text-slate-600 font-semibold'
            }`}
            onClick={() => setFilter('7days')}
          >
            Next 7 Days
          </button>
          <button
            className={`btn btn-sm ${
              filter === '30days'
                ? 'bg-white text-slate-900 shadow-sm border border-white/90 font-bold'
                : 'btn-ghost text-slate-600 font-semibold'
            }`}
            onClick={() => setFilter('30days')}
          >
            Next 30 Days
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="input pl-9 pr-7 text-xs h-9 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl shadow-xs focus:bg-white"
            placeholder="Search upcoming..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
              onClick={() => setSearch('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Date-grouped timeline schedule */}
      {dateGroups.length === 0 ? (
        <div className="card-glass p-8 rounded-2xl">
          <EmptyState
            icon={<CalendarClock size={40} className="text-slate-400" />}
            title="No revisions match your filter"
            description="All upcoming spaced repetitions have either been completed or none are scheduled in this timeframe."
            action={
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFilter('all');
                  setSearch('');
                }}
              >
                Reset Filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative pl-6 space-y-7 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-3 before:w-[2px] before:bg-white/80 before:shadow-[0_0_8px_rgba(255,255,255,0.9)]">
            {dateGroups.map((group) => (
              <div key={group.dateStr} className="relative space-y-3">
                {/* Timeline Marker */}
                <div className="absolute -left-6 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white border-2 border-emerald-600 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                </div>

                {/* Date header */}
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    {group.label}
                  </h2>
                  <span className="rounded-lg bg-white/70 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-white/80 shadow-xs">
                    {group.count} question{group.count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (in {group.daysUntil} day{group.daysUntil !== 1 ? 's' : ''})
                  </span>
                </div>

                {/* Question items scheduled for this date */}
                <div className="card-glass divide-y divide-white/60 rounded-2xl overflow-hidden shadow-xs border border-white/80">
                  {group.items.map(({ question, interval }) => (
                    <div
                      key={`${question.id}_${interval}`}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-white/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/questions/${question.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-emerald-700 no-underline truncate"
                          >
                            {question.questionName}
                          </Link>
                          {question.topic && (
                            <span className="rounded-lg bg-white/70 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-white/80 shadow-xs">
                              {question.topic}
                            </span>
                          )}
                          <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-500/25">
                            {REVISION_LABELS[interval]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Originally solved {formatDateDisplay(question.dateSolved)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => markRevision(question.id, interval, true)}
                          title="Mark revised early"
                        >
                          <CheckCircle2 size={13} />
                          <span>Done</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
