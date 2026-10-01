'use client';

import { Check } from 'lucide-react';
import { formatDateDisplay, isToday, isPast } from '@/lib/dates';

interface RevisionCellProps {
  dateStr: string;
  isCompleted?: boolean;
}

export default function RevisionCell({ dateStr, isCompleted }: RevisionCellProps) {
  const display = formatDateDisplay(dateStr);

  if (isCompleted) {
    return (
      <span className="rev-completed" title={`Completed (Scheduled: ${display})`}>
        <Check size={12} strokeWidth={2.5} />
        <span>{display}</span>
      </span>
    );
  }

  if (isToday(dateStr)) {
    return (
      <span className="rev-today" title="Due Today">
        {display}
      </span>
    );
  }

  if (isPast(dateStr)) {
    return (
      <span className="rev-overdue" title="Overdue">
        {display}
      </span>
    );
  }

  return <span className="rev-future">{display}</span>;
}
