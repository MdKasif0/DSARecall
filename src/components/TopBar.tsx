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
  } else if (pathname === '/practice') {
    pageTitle = 'Topic-Wise Practice';
    backHref = '/';
  } else if (pathname === '/achievements') {
    pageTitle = 'Achievements & Milestones';
    backHref = '/';
  } else if (pathname === '/settings') {
    pageTitle = 'Settings & Preferences';
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
    <div className="hide-mobile flex items-center justify-between pb-5">
      {/* Liquid Glass Breadcrumb Capsule */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-[#543E26] bg-white/65 backdrop-blur-md border border-white/80 shadow-[inset_0_1px_1px_#fff,0_1px_4px_rgba(70,50,30,0.03)] hover:bg-white/90 no-underline transition-all group"
      >
        <ArrowLeft
          size={13}
          className="text-[#8F8578] group-hover:text-[#543E26] group-hover:-translate-x-0.5 transition-transform"
        />
        <span>{pageTitle}</span>
      </Link>

      {/* Top right utility controls */}
      <div className="flex items-center gap-2.5">
        {/* Search trigger */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#635A4F] bg-white/65 backdrop-blur-md border border-white/80 shadow-[inset_0_1px_1px_#fff,0_1px_3px_rgba(70,50,30,0.03)] hover:bg-white/95 hover:text-[#231E18] hover:scale-105 transition-all"
          onClick={onSearchClick}
          aria-label="Quick Search"
          title="Search questions"
        >
          <Search size={15} />
        </button>

        {/* Notifications / Pending Revisions Alert */}
        <Link
          href="/today"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#635A4F] bg-white/65 backdrop-blur-md border border-white/80 shadow-[inset_0_1px_1px_#fff,0_1px_3px_rgba(70,50,30,0.03)] hover:bg-white/95 hover:text-[#231E18] hover:scale-105 transition-all"
          aria-label={
            pendingCount > 0 ? `${pendingCount} revisions need attention` : 'All caught up'
          }
          title={
            pendingCount > 0 ? `${pendingCount} revisions need attention` : 'All revisions up to date'
          }
        >
          <Bell size={15} />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#994738] shadow-[0_0_6px_rgba(153,71,56,0.6)]" />
          )}
        </Link>

        {/* User Avatar Circle */}
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#7A5D3E] to-[#4F3A24] text-[#FFFDF9] text-xs font-bold shadow-sm border border-white/30 select-none hover:scale-105 transition-all"
          title="Settings & Profile"
          aria-label="User settings"
        >
          K
        </Link>
      </div>
    </div>
  );
}
