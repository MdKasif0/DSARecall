'use client';

import { useState, useMemo } from 'react';
import {
  Trophy,
  Share2,
  Flame,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import { computeActivityStats } from '@/lib/analytics';
import { evaluateAchievements, type Achievement } from '@/lib/achievements';
import TopBar from '@/components/TopBar';
import ShareAchievementModal from '@/components/ShareAchievementModal';

export default function AchievementsPage() {
  const { questions, records, isLoaded } = useQuestions();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'streak' | 'revisions' | 'mastery'>('all');
  const [shareTarget, setShareTarget] = useState<Achievement | null>(null);

  const stats = useMemo(() => {
    return computeActivityStats(records, questions);
  }, [records, questions]);

  const achievements = useMemo(() => {
    return evaluateAchievements(questions, records, stats);
  }, [questions, records, stats]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading achievements...</p>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const completionPct = Math.round((unlockedCount / achievements.length) * 100);

  const filtered = achievements.filter((a) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'streak') return a.category === 'streak';
    if (selectedCategory === 'revisions') return a.category === 'revisions';
    if (selectedCategory === 'mastery') return a.category === 'mastery' || a.category === 'problem_solving';
    return true;
  });

  const tierColors: Record<Achievement['tier'], { badge: string; border: string }> = {
    bronze: { badge: 'bg-[#F2ECE2] text-[#8B6F47]', border: 'border-[#E4DDD2]' },
    silver: { badge: 'bg-[#F1E9DE] text-[#5F4930]', border: 'border-[#D5CCBF]' },
    gold: { badge: 'bg-[#EDE1CF] text-[#795B39]', border: 'border-[#DFD1BC]' },
    platinum: { badge: 'bg-[#E8EDE4] text-[#65755D]', border: 'border-[#D7DFD2]' },
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Breadcrumb and Profile */}
      <TopBar />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Achievements & Milestones
            </h1>
            <span className="rounded-full bg-[#E9DDCB] px-2.5 py-0.5 text-xs font-bold text-[#5F4930]">
              {unlockedCount} / {achievements.length} Unlocked
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Track your milestones, maintain discipline, and share achievements on LinkedIn and Twitter / X.
          </p>
        </div>
      </div>

      {/* Overview Progress Card */}
      <div className="card p-5 bg-[#FAF7F2] border border-[#E4DDD2]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5F4930] text-[#FFFDF9] shadow-sm">
              <Trophy size={22} />
            </div>
            <div>
              <p className="text-base font-bold text-text">
                {unlockedCount} of {achievements.length} Milestones Achieved
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {completionPct}% overall mastery progress across your spaced revision journey
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <p className="text-xs font-semibold text-text-muted">ACTIVE STREAK</p>
              <p className="text-base font-bold text-[#8B6F47] flex items-center gap-1 justify-end">
                <Flame size={16} />
                {stats.currentStreak} Days
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-right">
              <p className="text-xs font-semibold text-text-muted">REVISIONS</p>
              <p className="text-base font-bold text-text">
                {stats.totalCompleted}
              </p>
            </div>
          </div>
        </div>

        {/* Thin 5px progress bar */}
        <div className="w-full bg-[#E7DED1] rounded-full h-[5px] overflow-hidden mt-4">
          <div
            className="bg-[#8B6F47] h-[5px] rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F2ECE2] border border-[#E4DDD2] rounded-lg self-start overflow-x-auto">
        <button
          className={`btn btn-sm ${selectedCategory === 'all'
              ? 'bg-[#6B5035] text-white hover:bg-[#57412C] shadow-none'
              : 'btn-ghost text-text-secondary'
            }`}
          onClick={() => setSelectedCategory('all')}
        >
          All ({achievements.length})
        </button>
        <button
          className={`btn btn-sm ${selectedCategory === 'streak'
              ? 'bg-[#6B5035] text-white hover:bg-[#57412C] shadow-none'
              : 'btn-ghost text-text-secondary'
            }`}
          onClick={() => setSelectedCategory('streak')}
        >
          Streaks
        </button>
        <button
          className={`btn btn-sm ${selectedCategory === 'revisions'
              ? 'bg-[#6B5035] text-white hover:bg-[#57412C] shadow-none'
              : 'btn-ghost text-text-secondary'
            }`}
          onClick={() => setSelectedCategory('revisions')}
        >
          Revisions
        </button>
        <button
          className={`btn btn-sm ${selectedCategory === 'mastery'
              ? 'bg-[#6B5035] text-white hover:bg-[#57412C] shadow-none'
              : 'btn-ghost text-text-secondary'
            }`}
          onClick={() => setSelectedCategory('mastery')}
        >
          Mastery & Topics
        </button>
      </div>

      {/* Achievement Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const tierStyle = tierColors[item.tier];
          const pct = Math.round((item.progress / item.maxProgress) * 100);

          return (
            <div
              key={item.id}
              className={`card p-5 flex flex-col justify-between transition-all hover:border-[#D5CCBF] ${item.unlocked ? 'bg-[#FFFDF9]' : 'opacity-70 bg-[#FAF7F2]'
                }`}
            >
              <div>
                {/* Header row: Icon + Tier */}
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7F2] border border-border text-2xl select-none">
                    {item.icon}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.08em] ${tierStyle.badge}`}
                  >
                    {item.tier}
                  </span>
                </div>

                {/* Title and description */}
                <h3 className="text-base font-bold text-text mt-3">
                  {item.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Progress and Share Action */}
              <div className="mt-5 pt-3.5 border-t border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted text-[0.6875rem] font-medium">
                    {item.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[#6F8064] font-bold">
                        <CheckCircle2 size={13} />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-text-muted">
                        <Lock size={12} />
                        In Progress
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-text text-[0.6875rem]">
                    {item.progress} / {item.maxProgress} ({pct}%)
                  </span>
                </div>

                {/* Thin 5px progress bar */}
                <div className="w-full bg-[#E7DED1] rounded-full h-[5px] overflow-hidden">
                  <div
                    className={`h-[5px] rounded-full transition-all duration-300 ${item.unlocked ? 'bg-[#6F8064]' : 'bg-[#8B6F47]'
                      }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Share Button for unlocked achievements */}
                {item.unlocked && (
                  <button
                    className="btn btn-secondary btn-sm w-full mt-2 text-xs font-bold gap-1.5 hover:border-[#8B6F47] hover:text-[#5F4930]"
                    onClick={() => setShareTarget(item)}
                    title="Share this achievement on LinkedIn or Twitter / X"
                  >
                    <Share2 size={13} />
                    <span>Share on LinkedIn / X</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      <ShareAchievementModal
        achievement={shareTarget}
        onClose={() => setShareTarget(null)}
      />
    </div>
  );
}
