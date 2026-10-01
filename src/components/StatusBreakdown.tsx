'use client';

import { PieChart } from 'lucide-react';

interface StatusBreakdownProps {
  completed: number;
  upcoming: number;
  dueToday: number;
  overdue: number;
}

export default function StatusBreakdown({
  completed,
  upcoming,
  dueToday,
  overdue,
}: StatusBreakdownProps) {
  const total = completed + upcoming + dueToday + overdue;

  const categories = [
    {
      label: 'Completed',
      count: completed,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      color: '#6F8064', // success sage
      barBg: '#E8EDE4',
    },
    {
      label: 'Upcoming',
      count: upcoming,
      pct: total > 0 ? Math.round((upcoming / total) * 100) : 0,
      color: '#8B6F47', // warm brown
      barBg: '#F1E9DE',
    },
    {
      label: 'Due Today',
      count: dueToday,
      pct: total > 0 ? Math.round((dueToday / total) * 100) : 0,
      color: '#B18A50', // warm amber
      barBg: '#EDE1CF',
    },
    {
      label: 'Overdue',
      count: overdue,
      pct: total > 0 ? Math.round((overdue / total) * 100) : 0,
      color: '#A65D50', // terracotta
      barBg: '#F4E4DF',
    },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-1.5">
          <PieChart size={16} className="text-[#8B6F47]" />
          <h3 className="text-sm font-bold text-text">Revision Breakdown</h3>
        </div>
        <span className="text-xs text-text-muted font-medium">
          {total} total checkpoints
        </span>
      </div>

      {/* Horizontal Multi-Bar Visualizer */}
      <div className="h-3 w-full rounded-full overflow-hidden flex border border-border bg-[#F1E9DE] mb-4">
        {categories.map((c) =>
          c.pct > 0 ? (
            <div
              key={c.label}
              style={{
                width: `${c.pct}%`,
                backgroundColor: c.color,
              }}
              title={`${c.label}: ${c.count} (${c.pct}%)`}
              className="h-full transition-all duration-300"
            />
          ) : null
        )}
      </div>

      {/* Status Bars and Details */}
      <div className="space-y-2.5">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-[90px]">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-semibold text-text">{cat.label}</span>
            </div>

            <div className="flex-1 mx-3 hidden sm:block">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${cat.pct}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              <span className="font-bold text-text">{cat.count}</span>
              <span className="text-text-muted text-[0.6875rem] min-w-[32px]">
                ({cat.pct}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
