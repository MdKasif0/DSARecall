'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  List,
  CalendarCheck,
  CalendarClock,
  ClockAlert,
  Compass,
  Trophy,
  Download,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import { getTodayISO, isCheckpointCompleted } from '@/lib/dates';
import { REVISION_INTERVALS, REVISION_KEYS } from '@/lib/types';

interface SidebarProps {
  onOpenBackup: () => void;
}

export default function Sidebar({ onOpenBackup }: SidebarProps) {
  const pathname = usePathname();
  const { questions, recordsMap } = useQuestions();

  const today = getTodayISO();

  let dueTodayCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const d = q[REVISION_KEYS[interval]];
      if (d === today) {
        dueTodayCount++;
      } else if (d < today) {
        overdueCount++;
      } else {
        upcomingCount++;
      }
    }
  }

  const navLinks = [
    {
      href: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: '/questions',
      label: 'Questions',
      icon: List,
      badge: questions.length > 0 ? questions.length : null,
    },
    {
      href: '/practice',
      label: 'Practice',
      icon: Compass,
      badge: null,
    },
    {
      href: '/today',
      label: "Today's Revisions",
      icon: CalendarCheck,
      badge: dueTodayCount > 0 ? dueTodayCount : null,
    },
    {
      href: '/upcoming',
      label: 'Upcoming',
      icon: CalendarClock,
      badge: upcomingCount > 0 ? upcomingCount : null,
    },
    {
      href: '/overdue',
      label: 'Overdue',
      icon: ClockAlert,
      badge: overdueCount > 0 ? overdueCount : null,
    },
    {
      href: '/achievements',
      label: 'Achievements',
      icon: Trophy,
      badge: null,
    },
  ];

  return (
    <aside className="desktop-sidebar hide-mobile" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5F4930] shadow-sm">
            <BookOpen size={16} className="text-[#FFFDF9]" />
          </div>
          <div>
            <span className="text-[0.9375rem] font-bold tracking-tight text-[#29251F] block leading-none">
              DSA Recall
            </span>
            <span className="text-[0.625rem] font-semibold text-[#9A9287] uppercase tracking-[0.08em] block mt-1">
              SPACED REVISION
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        <div>
          <span className="px-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#9A9287] block mb-2">
            NAVIGATION
          </span>
          <nav className="space-y-1">
            {navLinks.map(({ href, label, icon: Icon, badge }) => {
              const active =
                href === '/'
                  ? pathname === '/'
                  : pathname === href || (href === '/upcoming' && pathname === '/revisions');

              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold no-underline transition-all ${active
                      ? 'bg-[#E9DDCB] text-[#5F4930]'
                      : 'text-[#71695F] hover:bg-[#F1E9DE] hover:text-[#29251F]'
                    }`}
                >
                  {/* Subtle active left accent indicator */}
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#5F4930]" />
                  )}

                  <div className="flex items-center gap-2.5 pl-1">
                    <Icon
                      size={17}
                      className={active ? 'text-[#5F4930]' : 'text-[#9A9287] group-hover:text-[#71695F]'}
                    />
                    <span>{label}</span>
                  </div>

                  {badge !== null && (
                    <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[0.6875rem] font-bold bg-[#E9DDCB] text-[#5F4930] min-w-[20px]">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Data Section */}
        <div>
          <span className="px-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#9A9287] block mb-2">
            DATA
          </span>
          <div className="space-y-1">
            <Link
              href="/settings"
              className={`flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold no-underline transition-colors ${pathname === '/settings'
                  ? 'bg-[#E9DDCB] text-[#5F4930]'
                  : 'text-[#71695F] hover:bg-[#F1E9DE] hover:text-[#29251F]'
                }`}
            >
              <div className="flex items-center gap-2.5 pl-1">
                <Settings
                  size={17}
                  className={pathname === '/settings' ? 'text-[#5F4930]' : 'text-[#9A9287]'}
                />
                <span>Settings</span>
              </div>
            </Link>

            <button
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold text-[#71695F] hover:bg-[#F1E9DE] hover:text-[#29251F] transition-colors"
              onClick={onOpenBackup}
            >
              <div className="flex items-center gap-2.5 pl-1">
                <Download size={17} className="text-[#9A9287]" />
                <span>Backup / Export</span>
              </div>
            </button>

            <div className="flex items-center justify-between px-3 py-2 text-xs text-[#71695F]">
              <span className="pl-1 text-xs">Local Storage</span>
              <span className="flex items-center gap-1.5 font-semibold text-[#6F8064] text-[0.6875rem]">
                <span className="h-2 w-2 rounded-full bg-[#6F8064]" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer: Subtle Study Card with Leaf Motif */}
      <div className="p-3.5 border-t border-border">
        <div className="rounded-lg border border-border bg-[#F2ECE2] p-3 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xl select-none" role="img" aria-label="sprout">
              🌿
            </span>
            <div className="text-[0.6875rem] font-semibold text-[#5F4930] leading-snug">
              <span>Keep Learning</span>
              <span className="block text-[#9A9287]">Keep Growing</span>
            </div>
          </div>
          <Link
            href="/questions"
            className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E9DDCB] text-[#5F4930] hover:bg-[#5F4930] hover:text-white transition-colors"
            title="Browse all questions"
          >
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
