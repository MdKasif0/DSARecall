'use client';

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  accent?: string;
}

export default function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-value" style={accent ? { color: accent } : undefined}>
            {value}
          </p>
          <p className="stat-label">{label}</p>
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
