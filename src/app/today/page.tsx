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

      {/* Quick Summary Strip */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <span className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-text-secondary">
          Due Today: <strong className="text-text font-bold ml-1">{dueTodayItems.length}</strong>
        </span>
        <span className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-text-secondary">
          Overdue:{' '}
          <strong
            className={`font-bold ml-1 ${
              overdueItems.length > 0 ? 'text-[#A65D50]' : 'text-text'
            }`}
          >
            {overdueItems.length}
          </strong>
        </span>
        <span className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-text-secondary">
          Completed Today:{' '}
          <strong className="text-[#6F8064] font-bold ml-1">
            {completedTodayRecords.length}
          </strong>
        </span>
      </div>

      {totalActionItems === 0 && completedTodayRecords.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckCircle2 size={44} className="text-[#6F8064]" />}
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
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F4E4DF] text-[#A65D50]">
                  <AlertCircle size={12} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[#A65D50]">
                  OVERDUE REVISIONS · {overdueItems.length}
                </h2>
              </div>

              <div className="space-y-2.5">
                {overdueItems.map(({ question, interval, scheduledDate, daysUntil }) => {
                  const doneTime = justCompletedIds.get(`${question.id}_${interval}`);
                  return (
                    <div
                      key={`${question.id}_${interval}`}
                      className={`card p-4 transition-all border-l-4 border-l-[#A65D50] ${
                        doneTime ? 'opacity-70 bg-[#FBF8F2]' : 'hover:border-[#D5CCBF]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                              href={`/questions/${question.id}`}
                              className="font-bold text-base text-text hover:text-[#8B6F47] no-underline"
                            >
                              {question.questionName}
                            </Link>
                            {question.topic && (
                              <span className="rounded bg-[#F2ECE2] px-2 py-0.5 text-[0.6875rem] font-medium text-[#71695F] border border-[#E4DDD2]">
                                {question.topic}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-bold bg-[#F4E4DF] text-[#925A4D] border border-[#E6D0CA]">
                              <AlertCircle size={11} />
                              +{interval} DAYS
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                            <span>
                              Originally solved{' '}
                              <strong className="text-text font-semibold">
                                {formatDateDisplay(question.dateSolved)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="text-[#A65D50] font-semibold">
                              {Math.abs(daysUntil)} day{Math.abs(daysUntil) === 1 ? '' : 's'} overdue
                              (Due {formatDateDisplay(scheduledDate)})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {doneTime ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8EDE4] px-3 py-1.5 text-xs font-bold text-[#65755D] border border-[#D7DFD2]">
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
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EDE1CF] text-[#795B39]">
                  <CalendarCheck size={12} />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[#795B39]">
                  DUE TODAY · {dueTodayItems.length}
                </h2>
              </div>

              <div className="space-y-2.5">
                {dueTodayItems.map(({ question, interval, scheduledDate }) => {
                  const doneTime = justCompletedIds.get(`${question.id}_${interval}`);
                  return (
                    <div
                      key={`${question.id}_${interval}`}
                      className={`card p-4 transition-all border-l-4 border-l-[#B18A50] ${
                        doneTime ? 'opacity-70 bg-[#FBF8F2]' : 'hover:border-[#D5CCBF]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                              href={`/questions/${question.id}`}
                              className="font-bold text-base text-text hover:text-[#8B6F47] no-underline"
                            >
                              {question.questionName}
                            </Link>
                            {question.topic && (
                              <span className="rounded bg-[#F2ECE2] px-2 py-0.5 text-[0.6875rem] font-medium text-[#71695F] border border-[#E4DDD2]">
                                {question.topic}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-bold bg-[#EDE1CF] text-[#795B39] border border-[#DFD1BC]">
                              <Clock size={11} />
                              +{interval} DAYS
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                            <span>
                              Originally solved{' '}
                              <strong className="text-text font-semibold">
                                {formatDateDisplay(question.dateSolved)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className="text-[#B18A50] font-semibold">
                              Due today ({formatDateDisplay(scheduledDate)})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {doneTime ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8EDE4] px-3 py-1.5 text-xs font-bold text-[#65755D] border border-[#D7DFD2]">
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
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#6F8064]" />
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[#6F8064]">
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
                      className="card p-3 bg-[#FAF7F2] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-text truncate">
                          {q.questionName}
                        </p>
                        <p className="text-[0.6875rem] text-text-muted mt-0.5">
                          {REVISION_LABELS[r.interval]} checkpoint
                        </p>
                      </div>
                      <span className="text-[0.6875rem] font-bold text-[#6F8064] bg-[#E8EDE4] px-2 py-0.5 rounded border border-[#D7DFD2]">
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
