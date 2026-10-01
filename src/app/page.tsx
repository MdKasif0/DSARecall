'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  AlertCircle,
  PieChart,
  FileText,
  Calendar,
  Flame,
  Compass,
  Trophy,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import {
  formatDateDisplay,
  getDaysUntilRevision,
  isCheckpointCompleted,
  getQuestionProgress,
} from '@/lib/dates';
import {
  REVISION_INTERVALS,
  REVISION_KEYS,
  REVISION_LABELS,
  type RevisionInterval,
  type DSAQuestion,
} from '@/lib/types';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import RevisionHeatmap from '@/components/RevisionHeatmap';
import ActivityChart from '@/components/ActivityChart';
import StatusBreakdown from '@/components/StatusBreakdown';
import TopBar from '@/components/TopBar';
import { computeActivityStats } from '@/lib/analytics';
import { openAddModal } from '@/lib/events';
import { getSettings } from '@/lib/settings';

interface ActionItem {
  question: DSAQuestion;
  interval: RevisionInterval;
  scheduledDate: string;
  diff: number;
}

export default function DashboardPage() {
  const { questions, records, recordsMap, isLoaded, markRevision } = useQuestions();
  const [justCompletedIds, setJustCompletedIds] = useState<Map<string, string>>(new Map());

  const [userName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return getSettings().userName || 'Kasif';
      } catch {
        return 'Kasif';
      }
    }
    return 'Kasif';
  });

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = userName ? `, ${userName}` : '';
    if (hour < 12) return `Good morning${name}`;
    if (hour < 18) return `Good afternoon${name}`;
    return `Good evening${name}`;
  }, [userName]);

  // Compute analytics stats for heatmap and chart
  const stats = useMemo(() => {
    return computeActivityStats(records, questions);
  }, [records, questions]);

  // Find due today, overdue, and upcoming revisions
  const dueTodayItems: ActionItem[] = [];
  const overdueItems: ActionItem[] = [];
  const upcomingItems: {
    question: DSAQuestion;
    interval: RevisionInterval;
    date: string;
    diff: number;
  }[] = [];

  let completedCheckpointsCount = 0;

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) {
        completedCheckpointsCount++;
        continue;
      }
      const scheduledDate = q[REVISION_KEYS[interval]];
      const diff = getDaysUntilRevision(scheduledDate);

      if (diff === 0) {
        dueTodayItems.push({ question: q, interval, scheduledDate, diff });
      } else if (diff < 0) {
        overdueItems.push({ question: q, interval, scheduledDate, diff });
      } else {
        upcomingItems.push({ question: q, interval, date: scheduledDate, diff });
      }
    }
  }

  // Sort
  overdueItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  upcomingItems.sort((a, b) => a.date.localeCompare(b.date));

  const totalActions = dueTodayItems.length + overdueItems.length;
  const totalPossible = questions.length * 6;
  const completionRate =
    totalPossible > 0 ? Math.round((completedCheckpointsCount / totalPossible) * 100) : 0;
  const avgRevisions = questions.length > 0 ? (completedCheckpointsCount / questions.length).toFixed(1) : '0';

  const upcomingSlice = upcomingItems.slice(0, 5);

  const handleMarkWithTimestamp = (qId: string, interval: RevisionInterval) => {
    markRevision(qId, interval, true);
    const key = `${qId}_${interval}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setJustCompletedIds((prev) => new Map(prev).set(key, timeStr));
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Top Bar with Breadcrumb and Profile */}
      <TopBar />

      {/* Header: Personalized Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            {greeting}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Keep your DSA revision cycle consistent.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          <Link
            href="/practice"
            className="btn btn-secondary btn-sm gap-1.5 text-xs font-semibold hover:border-[#8B6F47] hover:text-[#5F4930] no-underline"
            title="Explore topic-wise practice questions"
          >
            <Compass size={14} className="text-[#8B6F47]" />
            <span>Practice</span>
          </Link>
          <Link
            href="/achievements"
            className="btn btn-secondary btn-sm gap-1.5 text-xs font-semibold hover:border-[#8B6F47] hover:text-[#5F4930] no-underline"
            title="View achievements and share on LinkedIn / X"
          >
            <Trophy size={14} className="text-[#8B6F47]" />
            <span>Achievements</span>
          </Link>
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

      {/* Metric Row: Total, Due Today, Overdue, Streak, Completion */}
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
          value={dueTodayItems.length}
          icon={<Calendar size={18} />}
          trend={dueTodayItems.length > 0 ? 'Keep going!' : 'All clear!'}
          trendType={dueTodayItems.length > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Overdue"
          value={overdueItems.length}
          icon={<Clock size={18} />}
          trend={overdueItems.length > 0 ? `${overdueItems.length} need review` : 'All clear!'}
          trendType={overdueItems.length > 0 ? 'danger' : 'success'}
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
          value={`${completionRate}%`}
          icon={<PieChart size={18} />}
          trend={`${avgRevisions} / 6 avg. revisions`}
          trendType="neutral"
        />
      </div>

      {/* Revision Activity Heatmap (GitHub-style) */}
      <RevisionHeatmap stats={stats} />

      {/* Two Column Grid: Today's Revisions & Revision Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Today's Actionable Revisions (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-[#8B6F47]" />
              <h2 className="text-base font-bold text-text">Today&apos;s Revisions</h2>
              {totalActions > 0 && (
                <span className="rounded-full bg-[#EDE1CF] px-2 py-0.5 text-xs font-bold text-[#795B39] border border-[#DFD1BC]">
                  {totalActions} Actionable
                </span>
              )}
            </div>
            {totalActions > 0 && (
              <Link
                href="/today"
                className="flex items-center gap-1 text-xs font-semibold text-[#8B6F47] no-underline hover:underline"
              >
                Open dedicated view
                <ArrowRight size={13} />
              </Link>
            )}
          </div>

          {totalActions === 0 ? (
            <div className="card">
              <EmptyState
                icon={<CheckCircle2 size={36} className="text-[#6F8064]" />}
                title="You're all caught up."
                description="No questions scheduled for revision today. Keep building your streak by solving new problems."
                action={
                  <div className="flex items-center gap-2">
                    <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                      <Plus size={14} />
                      Add Question
                    </button>
                    <Link href="/upcoming" className="btn btn-secondary btn-sm no-underline">
                      View Upcoming
                    </Link>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Overdue items first */}
              {overdueItems.map(({ question, interval, scheduledDate, diff }) => {
                const justDoneTime = justCompletedIds.get(`${question.id}_${interval}`);
                return (
                  <div
                    key={`${question.id}_${interval}`}
                    className={`card p-4 transition-all border-l-4 border-l-[#A65D50] ${
                      justDoneTime ? 'opacity-70 bg-[#FBF8F2]' : 'hover:border-[#D5CCBF]'
                    }`}
                  >
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/questions/${question.id}`}
                            className="text-sm font-bold text-text hover:text-[#8B6F47] no-underline truncate"
                          >
                            {question.questionName}
                          </Link>
                          {question.topic && (
                            <span className="rounded bg-[#F2ECE2] px-1.5 py-0.5 text-[0.6875rem] font-medium text-[#71695F] border border-[#E4DDD2]">
                              {question.topic}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-[#F4E4DF] text-[#925A4D] border border-[#E6D0CA]">
                            <AlertCircle size={11} />
                            +{interval} DAYS
                          </span>
                          <span className="text-xs font-bold text-[#A65D50]">
                            {Math.abs(diff)}d overdue
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          <span>Originally solved {formatDateDisplay(question.dateSolved)}</span>
                          <span>•</span>
                          <span>Due {formatDateDisplay(scheduledDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {justDoneTime ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8EDE4] px-2.5 py-1 text-xs font-semibold text-[#65755D] border border-[#D7DFD2]">
                            <CheckCircle2 size={13} />
                            Completed {justDoneTime}
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkWithTimestamp(question.id, interval)}
                          >
                            <CheckCircle2 size={14} />
                            Mark Revised
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Due Today items */}
              {dueTodayItems.map(({ question, interval, scheduledDate }) => {
                const justDoneTime = justCompletedIds.get(`${question.id}_${interval}`);
                return (
                  <div
                    key={`${question.id}_${interval}`}
                    className={`card p-4 transition-all border-l-4 border-l-[#B18A50] ${
                      justDoneTime ? 'opacity-70 bg-[#FBF8F2]' : 'hover:border-[#D5CCBF]'
                    }`}
                  >
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/questions/${question.id}`}
                            className="text-sm font-bold text-text hover:text-[#8B6F47] no-underline truncate"
                          >
                            {question.questionName}
                          </Link>
                          {question.topic && (
                            <span className="rounded bg-[#F2ECE2] px-1.5 py-0.5 text-[0.6875rem] font-medium text-[#71695F] border border-[#E4DDD2]">
                              {question.topic}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-[#EDE1CF] text-[#795B39] border border-[#DFD1BC]">
                            <Clock size={11} />
                            +{interval} DAYS
                          </span>
                          <span className="text-xs font-bold text-[#B18A50]">
                            Due today
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          <span>Originally solved {formatDateDisplay(question.dateSolved)}</span>
                          <span>•</span>
                          <span>Due today ({formatDateDisplay(scheduledDate)})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {justDoneTime ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8EDE4] px-2.5 py-1 text-xs font-semibold text-[#65755D] border border-[#D7DFD2]">
                            <CheckCircle2 size={13} />
                            Completed {justDoneTime}
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkWithTimestamp(question.id, interval)}
                          >
                            <CheckCircle2 size={14} />
                            Mark Revised
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Revision Progress Overview (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text">Revision Progress</h2>
            <Link
              href="/questions"
              className="text-xs font-semibold text-[#8B6F47] hover:underline"
            >
              All questions ({questions.length})
            </Link>
          </div>

          <div className="card p-5 space-y-4">
            {/* Top completion metric */}
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div>
                <p className="text-2xl font-bold text-text leading-none">{completionRate}%</p>
                <p className="text-xs text-text-muted mt-1">Overall retention rate</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text">
                  {completedCheckpointsCount} of {totalPossible}
                </p>
                <p className="text-xs text-text-muted mt-0.5">revisions completed</p>
              </div>
            </div>

            {/* Questions with upcoming or pending progress */}
            <div className="space-y-3">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-text-muted block">
                RECENT PROGRESS
              </span>
              {questions.slice(0, 4).map((q) => {
                const { completedCount, total, percent } = getQuestionProgress(q.id, recordsMap);
                return (
                  <div key={q.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        href={`/questions/${q.id}`}
                        className="font-semibold text-text hover:text-[#8B6F47] truncate max-w-[180px] no-underline"
                      >
                        {q.questionName}
                      </Link>
                      <span className="text-text-muted text-[0.6875rem] font-medium">
                        {completedCount} / {total} · {percent}%
                      </span>
                    </div>
                    {/* Thin specular liquid progress bar */}
                    <div className="w-full bg-white/60 border border-white/70 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] rounded-full h-[6px] overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#8B6F47] to-[#6B5035] h-[6px] rounded-full transition-all duration-300 shadow-xs"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: 30-Day Activity Chart & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 30-Day Activity Line Chart (7 cols) */}
        <div className="lg:col-span-7">
          <ActivityChart data={stats.last30Days} />
        </div>

        {/* Right: Revision Breakdown Bar Chart (5 cols) */}
        <div className="lg:col-span-5">
          <StatusBreakdown
            completed={completedCheckpointsCount}
            upcoming={upcomingItems.length}
            dueToday={dueTodayItems.length}
            overdue={overdueItems.length}
          />
        </div>
      </div>

      {/* Upcoming Revisions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#7D613D]" />
            <h2 className="text-base font-bold text-text">Upcoming Revisions</h2>
          </div>
          {upcomingItems.length > 0 && (
            <Link
              href="/upcoming"
              className="flex items-center gap-1 text-xs font-semibold text-[#8B6F47] no-underline hover:underline"
            >
              Full schedule ({upcomingItems.length})
              <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {upcomingSlice.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Clock size={36} className="text-text-muted" />}
              title="No upcoming revisions"
              description="Add more solved questions to populate your future spaced repetition schedule."
            />
          </div>
        ) : (
          <div className="card divide-y divide-[rgba(255,255,255,0.6)] overflow-hidden">
            {upcomingSlice.map(({ question, interval, date, diff }) => (
              <div
                key={`${question.id}_${interval}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/45 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/questions/${question.id}`}
                      className="text-sm font-semibold text-text hover:text-[#8B6F47] no-underline truncate"
                    >
                      {question.questionName}
                    </Link>
                    <span className="rounded-md bg-white/70 px-2 py-0.5 text-[0.6875rem] font-bold text-[#635A4F] border border-white/80 shadow-xs backdrop-blur-sm">
                      {REVISION_LABELS[interval]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Scheduled for {formatDateDisplay(date)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/75 backdrop-blur-md px-3 py-0.5 text-xs font-bold text-[#543E26] border border-white/85 shadow-xs">
                    {diff === 1 ? 'Tomorrow' : `In ${diff} days`}
                  </span>
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
        )}
      </div>
    </div>
  );
}
