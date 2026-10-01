'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  ExternalLink,
  Plus,
  CheckCircle2,
  Sparkles,
  Filter,
  Lightbulb,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import { getTodayISO } from '@/lib/dates';
import {
  PRACTICE_QUESTIONS,
  PRACTICE_TOPICS,
  type PracticeQuestion,
} from '@/lib/practiceQuestions';
import type { QuestionDifficulty } from '@/lib/types';
import TopBar from '@/components/TopBar';

export default function PracticePage() {
  const { questions, addQuestion, refreshQuestions } = useQuestions();

  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideTracked, setHideTracked] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Set of lowercase names already in the tracker
  const trackedNamesSet = useMemo(() => {
    return new Set(questions.map((q) => q.questionName.toLowerCase().trim()));
  }, [questions]);

  // Topic question counts
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = { All: PRACTICE_QUESTIONS.length };
    for (const t of PRACTICE_TOPICS) {
      counts[t] = PRACTICE_QUESTIONS.filter((q) => q.topic === t).length;
    }
    return counts;
  }, []);

  // Filtered practice questions
  const filteredQuestions = useMemo(() => {
    return PRACTICE_QUESTIONS.filter((item) => {
      // Topic filter
      if (selectedTopic !== 'All' && item.topic !== selectedTopic) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'All' && item.difficulty !== selectedDifficulty) {
        return false;
      }

      // Hide tracked filter
      const isTracked = trackedNamesSet.has(item.name.toLowerCase().trim());
      if (hideTracked && isTracked) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesPattern = item.pattern.toLowerCase().includes(query);
        const matchesTopic = item.topic.toLowerCase().includes(query);
        const matchesNum = item.leetcodeNumber?.toString().includes(query);
        if (!matchesName && !matchesPattern && !matchesTopic && !matchesNum) {
          return false;
        }
      }

      return true;
    });
  }, [selectedTopic, selectedDifficulty, hideTracked, searchQuery, trackedNamesSet]);

  const trackedCount = useMemo(() => {
    return PRACTICE_QUESTIONS.filter((q) =>
      trackedNamesSet.has(q.name.toLowerCase().trim())
    ).length;
  }, [trackedNamesSet]);

  // Add individual question to Recall
  const handleAddToRecall = (item: PracticeQuestion) => {
    setAddingId(item.id);
    const today = getTodayISO();

    addQuestion(item.name, today, 'Pending', item.topic, item.difficulty);
    refreshQuestions();

    setNotification(`Added "${item.name}" to Recall! First revision scheduled.`);
    setTimeout(() => {
      setNotification(null);
      setAddingId(null);
    }, 3000);
  };

  // Batch add all currently filtered questions that are not yet tracked
  const handleBatchAddFiltered = () => {
    const toAdd = filteredQuestions.filter(
      (q) => !trackedNamesSet.has(q.name.toLowerCase().trim())
    );

    if (toAdd.length === 0) return;

    const confirmAdd = window.confirm(
      `Add all ${toAdd.length} unadded questions to your Recall revision tracker?`
    );
    if (!confirmAdd) return;

    const today = getTodayISO();
    for (const item of toAdd) {
      addQuestion(item.name, today, 'Pending', item.topic, item.difficulty);
    }
    refreshQuestions();

    setNotification(`Added ${toAdd.length} questions to your Recall schedule!`);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const getDifficultyBadge = (difficulty: QuestionDifficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-[#E3EBDD] text-[#55674C] border-[#CCD8C4]';
      case 'Medium':
        return 'bg-[#F7EEDD] text-[#9A7032] border-[#E9DAC1]';
      case 'Hard':
        return 'bg-[#F9E6E2] text-[#A65D50] border-[#ECD1CC]';
      default:
        return 'bg-[#F2ECE2] text-text-secondary border-border';
    }
  };

  return (
    <div className="space-y-6">
      <TopBar />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-[#CCD8C4] bg-[#F2F7F0] px-4 py-3 text-xs font-semibold text-[#55674C] shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Topic-Wise Practice Questions
            </h1>
            <span className="rounded-full bg-white/75 backdrop-blur-md border border-white/80 px-3 py-0.5 text-xs font-bold text-[#543E26] shadow-xs">
              {PRACTICE_QUESTIONS.length} Curated
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Curated high-yield problems categorized by pattern and data structure. Click &ldquo;+ Add to Recall&rdquo; to schedule them into your spaced revision cycle.
          </p>
        </div>

        {/* Global Stats Summary */}
        <div className="flex items-center gap-3 self-start rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 shadow-[inset_0_1px_1.5px_#fff,0_4px_16px_rgba(70,50,30,0.03)] backdrop-blur-md">
          <div>
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-muted block">
              IN RECALL
            </span>
            <span className="text-sm font-bold text-[#543E26]">
              {trackedCount} / {PRACTICE_QUESTIONS.length}
            </span>
          </div>
          <div className="h-7 w-px bg-white/60" />
          <div>
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-muted block">
              COVERAGE
            </span>
            <span className="text-sm font-bold text-[#526844]">
              {Math.round((trackedCount / PRACTICE_QUESTIONS.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3.5 bg-white/60 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1px_#fff]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search by name, pattern (e.g. 'Two Pointers', 'Sliding Window', 'DP')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 text-xs w-full bg-white/70 border-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
            />
          </div>

          {/* Difficulty and Hide Tracked Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Filter size={13} className="text-text-muted" />
              <span className="font-semibold text-[0.6875rem] uppercase tracking-wider">
                Difficulty:
              </span>
            </div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="select text-xs py-1.5 px-2.5 bg-white/70 border-white/80 text-text rounded-lg"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none ml-2">
              <input
                type="checkbox"
                checked={hideTracked}
                onChange={(e) => setHideTracked(e.target.checked)}
                className="rounded border-[#D5CCBF] text-[#543E26] focus:ring-[#8B6F47]"
              />
              <span>Unadded Only</span>
            </label>
          </div>
        </div>

        {/* Topic Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            className={`btn btn-sm shrink-0 text-xs rounded-full ${
              selectedTopic === 'All'
                ? 'bg-gradient-to-b from-[#6E5338] to-[#4F3A24] text-white shadow-md border border-white/20'
                : 'bg-white/60 text-[#635A4F] border border-white/80 backdrop-blur-md hover:bg-white/90 shadow-xs'
            }`}
            onClick={() => setSelectedTopic('All')}
          >
            All Topics ({topicCounts['All']})
          </button>
          {PRACTICE_TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic;
            const count = topicCounts[topic] || 0;
            return (
              <button
                key={topic}
                className={`btn btn-sm shrink-0 text-xs rounded-full ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#6E5338] to-[#4F3A24] text-white shadow-md border border-white/20'
                    : 'bg-white/60 text-[#635A4F] border border-white/80 backdrop-blur-md hover:bg-white/90 shadow-xs'
                }`}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header with Batch Action */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-text-muted">
          Showing {filteredQuestions.length} practice problems
          {selectedTopic !== 'All' ? ` in ${selectedTopic}` : ''}
          {selectedDifficulty !== 'All' ? ` • ${selectedDifficulty}` : ''}
        </p>

        {filteredQuestions.some((q) => !trackedNamesSet.has(q.name.toLowerCase().trim())) && (
          <button
            className="btn btn-secondary btn-sm text-xs font-semibold gap-1.5 hover:border-[#8B6F47] hover:text-[#5F4930]"
            onClick={handleBatchAddFiltered}
          >
            <Sparkles size={13} className="text-[#8B6F47]" />
            <span>Add Unadded ({filteredQuestions.filter((q) => !trackedNamesSet.has(q.name.toLowerCase().trim())).length}) to Recall</span>
          </button>
        )}
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="card p-12 text-center bg-[#FAF7F2] border border-[#E4DDD2]">
          <Compass size={32} className="mx-auto text-text-muted mb-2.5 opacity-60" />
          <h3 className="text-base font-bold text-text">No practice questions match</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            Try adjusting your search query, topic filter, or difficulty selection.
          </p>
          <button
            className="btn btn-secondary btn-sm mt-4 text-xs font-semibold"
            onClick={() => {
              setSelectedTopic('All');
              setSelectedDifficulty('All');
              setSearchQuery('');
              setHideTracked(false);
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredQuestions.map((item) => {
            const isTracked = trackedNamesSet.has(item.name.toLowerCase().trim());
            const isAdding = addingId === item.id;

            return (
              <div
                key={item.id}
                className="card p-4 flex flex-col justify-between bg-[#FFFDF9] border border-[#E4DDD2] hover:border-[#D5CCBF] transition-all hover:shadow-xs"
              >
                <div>
                  {/* Top line: topic + difficulty + leetcode tag */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#8B6F47]">
                      {item.topic}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.625rem] font-bold border ${getDifficultyBadge(
                          item.difficulty
                        )}`}
                      >
                        {item.difficulty}
                      </span>
                      {item.leetcodeNumber && (
                        <span className="rounded bg-[#F2ECE2] px-1.5 py-0.5 text-[0.625rem] font-mono font-semibold text-text-secondary">
                          #{item.leetcodeNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Title */}
                  <h3 className="text-sm font-bold text-text group flex items-start justify-between gap-2">
                    <span>{item.name}</span>
                    <a
                      href={
                        item.link ||
                        `https://leetcode.com/problem-list/all-codes/?search=${encodeURIComponent(item.name)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-[#5F4930] transition-colors shrink-0 mt-0.5"
                      title="View problem on LeetCode"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </h3>

                  {/* Pattern badge */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="rounded-md bg-[#F2ECE2] px-2 py-0.5 text-[0.6875rem] font-medium text-[#5F4930]">
                      Pattern: {item.pattern}
                    </span>
                  </div>

                  {/* Pro Tip / Algorithmic Intuition */}
                  {item.tip && (
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-[#FAF7F2] p-2.5 border border-[#EBE4D8] text-[0.75rem] text-[#71695F] leading-relaxed">
                      <Lightbulb size={13} className="text-[#8B6F47] shrink-0 mt-0.5" />
                      <span>{item.tip}</span>
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className="mt-4 pt-3 border-t border-[#EFE8DC] flex items-center justify-between">
                  {isTracked ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#6F8064]">
                      <CheckCircle2 size={15} />
                      <span>In Spaced Recall</span>
                    </div>
                  ) : (
                    <span className="text-[0.6875rem] text-text-muted">
                      Not scheduled yet
                    </span>
                  )}

                  {isTracked ? (
                    <Link
                      href={`/questions?search=${encodeURIComponent(item.name)}`}
                      className="btn btn-ghost btn-sm text-xs font-semibold text-[#5F4930] hover:bg-[#F2ECE2]"
                    >
                      View Schedule &rarr;
                    </Link>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm text-xs font-bold gap-1 px-3"
                      onClick={() => handleAddToRecall(item)}
                      disabled={isAdding}
                    >
                      <Plus size={13} />
                      <span>{isAdding ? 'Adding...' : 'Add to Recall'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
