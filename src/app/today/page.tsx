'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
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
import EmptyState from '@/components/EmptyState';
import TopBar from '@/components/TopBar';
import { openAddModal } from '@/lib/events';

interface RevisionActionItem {
  question: DSAQuestion;
  interval: RevisionInterval;
  scheduledDate: string;
  daysUntil: number;
}

export default function TodayPage() {
  const { questions, records, recordsMap, isLoaded, markRevision } = useQuestions();
  const [justCompletedIds, setJustCompletedIds] = useState<Map<string, string>>(new Map());

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading today&apos;s revisions...</p>
      </div>
    );
  }

  const today = getTodayISO();

  // Find uncompleted items due today and overdue
  const dueTodayItems: RevisionActionItem[] = [];
  const overdueItems: RevisionActionItem[] = [];

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const scheduledDate = q[REVISION_KEYS[interval]];
      const diff = getDaysUntilRevision(scheduledDate);

      if (diff === 0) {
        dueTodayItems.push({ question: q, interval, scheduledDate, daysUntil: diff });
      } else if (diff < 0) {
        overdueItems.push({ question: q, interval, scheduledDate, daysUntil: diff });
      }
    }
  }

  // Sort overdue items by oldest scheduled date first
  overdueItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  // Find items completed today
  const completedTodayRecords = records.filter((r) => {
    if (!r.completed || !r.completedAt) return false;
    return r.completedAt.startsWith(today);
  });

  const totalActionItems = dueTodayItems.length + overdueItems.length;

  const handleMark = (qId: string, interval: RevisionInterval) => {
    markRevision(qId, interval, true);
    const key = `${qId}_${interval}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setJustCompletedIds((prev) => new Map(prev).set(key, timeStr));
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Breadcrumb and Profile */}
      <TopBar />

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Today&apos;s Revisions
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {totalActionItems === 0
              ? 'No questions scheduled for revision today.'
              : `${totalActionItems} question${totalActionItems !== 1 ? 's' : ''} scheduled for revision today.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/upcoming" className="btn btn-secondary btn-sm no-underline">
            <span>Upcoming Schedule</span>
            <ArrowRight size={14} />
          </Link>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={15} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Strip (Liquid Glass Capsules) */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <span className="card-glass rounded-xl px-3.5 py-2 font-semibold text-slate-700 shadow-xs border border-white/80">
          Due Today: <strong className="text-slate-900 font-bold ml-1">{dueTodayItems.length}</strong>
        </span>
        <span className="card-glass rounded-xl px-3.5 py-2 font-semibold text-slate-700 shadow-xs border border-white/80">
          Overdue:{' '}
          <strong
            className={`font-bold ml-1 ${
              overdueItems.length > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdueItems.length}
          </strong>
        </span>
        <span className="card-glass rounded-xl px-3.5 py-2 font-semibold text-slate-700 shadow-xs border border-white/80">
          Completed Today:{' '}
          <strong className="text-emerald-700 font-bold ml-1">
            {completedTodayRecords.length}
          </strong>
        </span>
      </div>

      {totalActionItems === 0 && completedTodayRecords.length === 0 ? (
        <div className="card-glass p-8 rounded-2xl">
          <EmptyState
            icon={<CheckCircle2 size={44} className="text-emerald-600" />}
            title="You're all caught up."
            description="Your revision schedule is clear for today. Add another solved DSA problem to keep building long-term memory."
            action={
              <div className="flex items-center gap-2">
                <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                  <Plus size={14} />
                  Add Question
                </button>
                <Link href="/upcoming" className="btn btn-secondary btn-sm no-underline">
                  View Upcoming Schedule
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/15 text-rose-700 border border-rose-500/25">
                  <AlertCircle size={12} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-rose-700">
                  OVERDUE REVISIONS · {overdueItems.length}
                </h2>
              </div>

              <div className="space-y-2.5">
                {overdueItems.map(({ question, interval, scheduledDate, daysUntil }) => {
                  const doneTime = justCompletedIds.get(`${question.id}_${interval}`);
                  return (
                    <div
                      key={`${question.id}_${interval}`}
                      className={`card-glass rounded-2xl p-4 transition-all border-l-4 border-l-rose-500 ${
                        doneTime ? 'opacity-65 bg-white/40' : 'hover:border-white'
                      } shadow-[0_4px_24px_rgba(244,63,94,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)]`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                              href={`/questions/${question.id}`}
                              className="font-bold text-base text-slate-900 hover:text-emerald-700 no-underline"
                            >
                              {question.questionName}
                            </Link>
                            {question.topic && (
                              <span className="rounded-lg bg-white/70 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-white/80 shadow-xs">
                                {question.topic}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold bg-rose-500/15 text-rose-700 border border-rose-500/25">
                              <AlertCircle size={11} />
                              +{interval} DAYS
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>
                              Originally solved{' '}
                              <strong className="text-slate-800 font-semibold">
                                {formatDateDisplay(question.dateSolved)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="text-rose-700 font-semibold">
                              {Math.abs(daysUntil)} day{Math.abs(daysUntil) === 1 ? '' : 's'} overdue
                              (Due {formatDateDisplay(scheduledDate)})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {doneTime ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-500/25">
                              <CheckCircle2 size={14} />
                              Completed {doneTime}
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleMark(question.id, interval)}
                            >
                              <CheckCircle2 size={14} />
                              <span>Mark Revised</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Due Today Section */}
          {dueTodayItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/25">
                  <CalendarCheck size={12} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">
                  DUE TODAY · {dueTodayItems.length}
                </h2>
              </div>

              <div className="space-y-2.5">
                {dueTodayItems.map(({ question, interval, scheduledDate }) => {
                  const doneTime = justCompletedIds.get(`${question.id}_${interval}`);
                  return (
                    <div
                      key={`${question.id}_${interval}`}
                      className={`card-glass rounded-2xl p-4 transition-all border-l-4 border-l-amber-500 ${
                        doneTime ? 'opacity-65 bg-white/40' : 'hover:border-white'
                      } shadow-[0_4px_24px_rgba(245,158,11,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)]`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                              href={`/questions/${question.id}`}
                              className="font-bold text-base text-slate-900 hover:text-emerald-700 no-underline"
                            >
                              {question.questionName}
                            </Link>
                            {question.topic && (
                              <span className="rounded-lg bg-white/70 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-white/80 shadow-xs">
                                {question.topic}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold bg-amber-500/15 text-amber-800 border border-amber-500/25">
                              <Clock size={11} />
                              +{interval} DAYS
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>
                              Originally solved{' '}
                              <strong className="text-slate-800 font-semibold">
                                {formatDateDisplay(question.dateSolved)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="text-amber-800 font-semibold">
                              Due today ({formatDateDisplay(scheduledDate)})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {doneTime ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-500/25">
                              <CheckCircle2 size={14} />
                              Completed {doneTime}
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleMark(question.id, interval)}
                            >
                              <CheckCircle2 size={14} />
                              <span>Mark Revised</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Already Completed Today */}
          {completedTodayRecords.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-800">
                  COMPLETED TODAY · {completedTodayRecords.length}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {completedTodayRecords.map((r) => {
                  const q = questions.find((item) => item.id === r.questionId);
                  if (!q) return null;
                  const time = r.completedAt
                    ? new Date(r.completedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  return (
                    <div
                      key={r.id}
                      className="card-glass rounded-xl p-3 flex items-center justify-between gap-2 border border-white/80"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {q.questionName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {REVISION_LABELS[r.interval]} checkpoint
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/25">
                        ✓ {time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
