'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
  getTodayISO,
  formatDateDisplay,
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
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
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

  const today = getTodayISO();

  // Gather all future uncompleted revisions
  const allUpcoming: UpcomingRevision[] = [];

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const scheduledDate = q[REVISION_KEYS[interval]];
      const daysUntil = getDaysUntilRevision(scheduledDate);

      // Only strictly future items
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
      item.question.questionName.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Group into timeline buckets
  const tomorrowItems: UpcomingRevision[] = [];
  const thisWeekItems: UpcomingRevision[] = [];
  const nextTwoWeeksItems: UpcomingRevision[] = [];
  const thisMonthItems: UpcomingRevision[] = [];
  const laterItems: UpcomingRevision[] = [];

  for (const item of filtered) {
    if (item.daysUntil === 1) {
      tomorrowItems.push(item);
    } else if (item.daysUntil <= 7) {
      thisWeekItems.push(item);
    } else if (item.daysUntil <= 14) {
      nextTwoWeeksItems.push(item);
    } else if (item.daysUntil <= 30) {
      thisMonthItems.push(item);
    } else {
      laterItems.push(item);
    }
  }

  const sections = [
    { title: 'Tomorrow', items: tomorrowItems, count: tomorrowItems.length },
    { title: 'This Week (Days 2–7)', items: thisWeekItems, count: thisWeekItems.length },
    { title: 'Next 2 Weeks (Days 8–14)', items: nextTwoWeeksItems, count: nextTwoWeeksItems.length },
    { title: 'This Month (Days 15–30)', items: thisMonthItems, count: thisMonthItems.length },
    { title: 'Later (30+ Days)', items: laterItems, count: laterItems.length },
  ].filter((s) => s.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Upcoming Revisions Timeline</h1>
          <p className="text-sm text-text-muted">
            Future spaced repetition schedule across all tracked questions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/today" className="btn btn-secondary btn-sm no-underline">
            Check Today&apos;s Due
            <ArrowRight size={14} />
          </Link>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={15} />
            Add Question
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Timeframe Chips */}
        <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-lg self-start">
          <button
            className={`btn btn-sm ${
              filter === 'all'
                ? 'bg-primary text-white hover:bg-primary-hover shadow-none'
                : 'btn-ghost'
            }`}
            onClick={() => setFilter('all')}
          >
            All Upcoming ({allUpcoming.length})
          </button>
          <button
            className={`btn btn-sm ${
              filter === '7days'
                ? 'bg-primary text-white hover:bg-primary-hover shadow-none'
                : 'btn-ghost'
            }`}
            onClick={() => setFilter('7days')}
          >
            Next 7 Days
          </button>
          <button
            className={`btn btn-sm ${
              filter === '30days'
                ? 'bg-primary text-white hover:bg-primary-hover shadow-none'
                : 'btn-ghost'
            }`}
            onClick={() => setFilter('30days')}
          >
            Next 30 Days
          </button>
        </div>

        {/* Search */}
        {allUpcoming.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              className="input pl-9 text-xs"
              placeholder="Filter by question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {allUpcoming.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CalendarClock size={44} className="text-text-muted" />}
            title="No upcoming revisions scheduled"
            description="Add questions or mark revisions to build your spaced repetition learning schedule."
            action={
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                <Plus size={15} />
                Add Question
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Filter size={40} className="text-text-muted" />}
            title="No matches found"
            description="Try changing the timeframe filter or search query."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-border pb-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {section.title}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-text-muted">
                  {section.count}
                </span>
              </div>

              <div className="space-y-2">
                {section.items.map(({ question, interval, scheduledDate, daysUntil }) => (
                  <div
                    key={`${question.id}_${interval}`}
                    className="card p-3.5 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/questions/${question.id}`}
                          className="font-medium text-sm text-text hover:text-primary no-underline transition-colors truncate"
                        >
                          {question.questionName}
                        </Link>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {REVISION_LABELS[interval]}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <span>
                          Scheduled for {formatDateDisplay(scheduledDate)}
                        </span>
                        <span>•</span>
                        <span>
                          Solved {formatDateDisplay(question.dateSolved)}
                        </span>
                        <span>•</span>
                        <StatusBadge status={question.status} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center self-end">
                      <div className="text-right">
                        <span className="inline-block rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-bold text-primary">
                          {daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                        </span>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => markRevision(question.id, interval, true)}
                        title="Mark revised early"
                      >
                        <CheckCircle2 size={14} />
                        Mark Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
