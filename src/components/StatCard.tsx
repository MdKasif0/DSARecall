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
    <div className="card p-4 flex items-center gap-3.5 hover:-translate-y-0.5 transition-all duration-150 cursor-default">
      {/* Liquid Glass Icon Container */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/85 bg-white/70 text-[#0F172A] shadow-[inset_0_1px_1.5px_#fff,0_2px_6px_rgba(15,23,42,0.03)] backdrop-blur-md">
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
                    ? 'text-emerald-600 font-semibold'
                    : trendType === 'danger'
                    ? 'text-rose-600 font-semibold'
                    : trendType === 'warning'
                    ? 'text-amber-600 font-semibold'
                    : 'text-slate-500'
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
