'use client';

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  subtext?: string;
  trend?: string;
  trendType?: 'neutral' | 'success' | 'warning' | 'danger';
}

export default function StatCard({
  label,
  value,
  icon,
  subtext,
  trend,
  trendType = 'neutral',
}: StatCardProps) {
  return (
    <div className="card p-4 flex items-center gap-3.5 transition-all hover:border-[#D5CCBF]">
      {/* Icon Container */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-[#FBF8F2] text-[#8B6F47]">
        {icon}
      </div>

      {/* Metric details */}
      <div className="min-w-0 flex-1">
        <p className="text-xl sm:text-2xl font-bold tracking-tight text-text leading-none">
          {value}
        </p>
        <p className="text-xs font-semibold text-text-secondary mt-1 truncate">
          {label}
        </p>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-1 text-[0.6875rem] font-medium leading-none">
            {trend && (
              <span
                className={
                  trendType === 'success'
                    ? 'text-[#6F8064] font-semibold'
                    : trendType === 'danger'
                    ? 'text-[#A65D50] font-semibold'
                    : trendType === 'warning'
                    ? 'text-[#B18A50] font-semibold'
                    : 'text-[#71695F]'
                }
              >
                {trend}
              </span>
            )}
            {subtext && <span className="text-text-muted">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
