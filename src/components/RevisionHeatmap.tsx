'use client';

import { useState } from 'react';
import { Flame, Trophy, BarChart3, Target, Calendar } from 'lucide-react';
import { formatDateDisplay } from '@/lib/dates';
import type { ActivityStats, DayActivity } from '@/lib/analytics';

interface RevisionHeatmapProps {
  stats: ActivityStats;
}

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4 | 5, string> = {
  0: 'rgba(226, 232, 240, 0.8)',
  1: '#A7F3D0',
  2: '#6EE7B7',
  3: '#34D399',
  4: '#10B981',
  5: '#047857',
};

export default function RevisionHeatmap({ stats }: RevisionHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  // Group 371 days into 53 columns (each column has 7 days)
  const columns: DayActivity[][] = [];
  for (let i = 0; i < stats.heatmapDays.length; i += 7) {
    columns.push(stats.heatmapDays.slice(i, i + 7));
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.6)] pb-3.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#059669]" />
            <h3 className="text-sm font-bold text-text">Revision Activity</h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Your daily revision activity over the last 12 months
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/70 backdrop-blur-md border border-white/80 px-3 py-0.5 text-xs font-bold text-[#0F172A] shadow-xs">
            Last 12 months
          </span>
        </div>
      </div>

      {/* Main Container: Heatmap Grid + Streak Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Heatmap Grid (Scrollable on small devices) */}
        <div className="lg:col-span-3 overflow-x-auto pb-2">
          <div className="min-w-[660px]">
            {/* Month labels */}
            <div className="flex text-[0.625rem] font-semibold text-text-muted mb-1.5 pl-7">
              {stats.monthLabels.map((m, idx) => (
                <div
                  key={`${m.month}-${idx}`}
                  style={{
                    position: 'relative',
                    left: `${Math.max(0, m.colIndex * 14.5 - idx * 24)}px`,
                    marginRight: '12px',
                  }}
                >
                  {m.month}
                </div>
              ))}
            </div>

            {/* Grid with Day of week labels */}
            <div className="flex gap-1.5 items-start">
              {/* Day Labels */}
              <div className="flex flex-col gap-[3px] text-[0.625rem] font-semibold text-text-muted pt-0.5 w-6 text-right select-none">
                <span className="h-[12px] leading-[12px]"></span>
                <span className="h-[12px] leading-[12px]">Mon</span>
                <span className="h-[12px] leading-[12px]"></span>
                <span className="h-[12px] leading-[12px]">Wed</span>
                <span className="h-[12px] leading-[12px]"></span>
                <span className="h-[12px] leading-[12px]">Fri</span>
                <span className="h-[12px] leading-[12px]"></span>
              </div>

              {/* 53 Columns */}
              <div className="flex gap-[3px]">
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-[3px]">
                    {col.map((day) => {
                      const color = LEVEL_COLORS[day.level];
                      return (
                        <div
                          key={day.date}
                          className="h-[12px] w-[12px] rounded-[3px] transition-transform hover:scale-125 cursor-pointer relative shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)]"
                          style={{ backgroundColor: color }}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend & Hover Info */}
            <div className="mt-3.5 flex items-center justify-between text-xs text-text-muted border-t border-[rgba(226,232,240,0.7)] pt-2.5">
              <div className="min-h-[20px]">
                {hoveredDay ? (
                  <span className="font-semibold text-text">
                    {formatDateDisplay(hoveredDay.date)}: {hoveredDay.count} revision
                    {hoveredDay.count !== 1 ? 's' : ''} completed
                  </span>
                ) : (
                  <span>Hover over any day to see revision history</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[0.6875rem]">
                <span>Less</span>
                {([0, 1, 2, 3, 4, 5] as const).map((lvl) => (
                  <div
                    key={lvl}
                    className="h-[10px] w-[10px] rounded-[2px]"
                    style={{ backgroundColor: LEVEL_COLORS[lvl] }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streak & Activity Summary Beside Heatmap */}
        <div className="border-t lg:border-t-0 lg:border-l border-[rgba(255,255,255,0.6)] pt-4 lg:pt-0 lg:pl-6 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/75 border border-white/85 shadow-[inset_0_1px_1px_#fff,0_1px_3px_rgba(15,23,42,0.03)] text-amber-500">
              <Flame size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-text">
                {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''}
              </p>
              <p className="text-[0.6875rem] text-text-muted">Current streak</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/75 border border-white/85 shadow-[inset_0_1px_1px_#fff,0_1px_3px_rgba(15,23,42,0.03)] text-emerald-600">
              <Trophy size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-text">
                {stats.longestStreak} day{stats.longestStreak !== 1 ? 's' : ''}
              </p>
              <p className="text-[0.6875rem] text-text-muted">Longest streak</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/75 border border-white/85 shadow-[inset_0_1px_1px_#fff,0_1px_3px_rgba(15,23,42,0.03)] text-sky-600">
              <BarChart3 size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-text">
                {stats.totalCompleted}
              </p>
              <p className="text-[0.6875rem] text-text-muted">Revisions completed</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/75 border border-white/85 shadow-[inset_0_1px_1px_#fff,0_1px_3px_rgba(15,23,42,0.03)] text-indigo-600">
              <Target size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-text">
                {stats.activeDays}
              </p>
              <p className="text-[0.6875rem] text-text-muted">Active study days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
