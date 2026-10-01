'use client';

import { formatDateDisplay, isToday, isPast } from '@/lib/dates';

interface RevisionCellProps {
  dateStr: string;
}

export default function RevisionCell({ dateStr }: RevisionCellProps) {
  const display = formatDateDisplay(dateStr);

  if (isToday(dateStr)) {
    return <span className="rev-today">{display}</span>;
  }

  if (isPast(dateStr)) {
    return <span className="rev-overdue">{display}</span>;
  }

  return <span className="rev-future">{display}</span>;
}
