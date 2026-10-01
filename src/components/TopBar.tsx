'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Bell } from 'lucide-react';
import { useQuestions } from '@/lib/context';
import { getTodayISO, isCheckpointCompleted } from '@/lib/dates';
import { REVISION_INTERVALS, REVISION_KEYS } from '@/lib/types';

interface TopBarProps {
  onSearchClick?: () => void;
}

export default function TopBar({ onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const { questions, recordsMap } = useQuestions();

  const today = getTodayISO();

  // Calculate pending items for notification indicator
  let pendingCount = 0;
  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const d = q[REVISION_KEYS[interval]];
      if (d <= today) pendingCount++;
    }
  }

  let pageTitle = 'Dashboard';
  let backHref = '/';

  if (pathname === '/questions') {
    pageTitle = 'Questions';
    backHref = '/';
  } else if (pathname === '/today') {
    pageTitle = "Today's Revisions";
    backHref = '/';
  } else if (pathname === '/upcoming' || pathname === '/revisions') {
    pageTitle = 'Upcoming';
    backHref = '/';
  } else if (pathname === '/overdue') {
    pageTitle = 'Overdue';
    backHref = '/';
  } else if (pathname.startsWith('/questions/')) {
    pageTitle = 'Question Detail';
    backHref = '/questions';
  }

  return (
    <div className="hide-mobile flex items-center justify-between pb-4">
      {/* Breadcrumb / Section Link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text no-underline transition-colors group"
      >
        <ArrowLeft
          size={14}
          className="text-text-muted group-hover:text-text group-hover:-translate-x-0.5 transition-transform"
        />
        <span>{pageTitle}</span>
      </Link>

      {/* Top right utility controls */}
      <div className="flex items-center gap-3">
        {/* Search trigger */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary hover:text-text transition-colors"
          onClick={onSearchClick}
          aria-label="Quick Search"
          title="Search questions"
        >
          <Search size={16} />
        </button>

        {/* Notifications / Pending Revisions Alert */}
        <Link
          href="/today"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary hover:text-text transition-colors"
          aria-label={
            pendingCount > 0 ? `${pendingCount} revisions need attention` : 'All caught up'
          }
          title={
            pendingCount > 0 ? `${pendingCount} revisions need attention` : 'All revisions up to date'
          }
        >
          <Bell size={16} />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#A65D50]" />
          )}
        </Link>

        {/* User Avatar Circle */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B6F47] text-[#FFFDF9] text-xs font-bold shadow-sm select-none"
          title="Kasif"
          aria-label="User profile: Kasif"
        >
          K
        </div>
      </div>
    </div>
  );
}
