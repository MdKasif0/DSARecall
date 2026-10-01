'use client';

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: string;
  subtitle?: string;
}

export default function StatCard({ label, value, icon, accent, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-value" style={accent ? { color: accent } : undefined}>
            {value}
          </p>
          <p className="stat-label">{label}</p>
          {subtitle && (
            <p className="text-[0.6875rem] text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent ? `${accent}14` : 'var(--bg)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
