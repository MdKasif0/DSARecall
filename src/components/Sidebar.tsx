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
      {/* macOS Window Header & Brand */}
      <div className="border-b border-[rgba(255,255,255,0.5)] px-4 pt-3.5 pb-3 space-y-3">
        {/* Authentic macOS Window Controls */}
        <div className="flex items-center gap-2 pl-1">
          <span className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
          <span className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
        </div>

        <Link href="/" className="flex items-center gap-3 no-underline pl-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-[#6E5338] to-[#4F3A24] shadow-md border border-white/25">
            <BookOpen size={16} className="text-[#FFFDF9]" />
          </div>
          <div>
            <span className="text-[0.9375rem] font-bold tracking-tight text-[#231E18] block leading-none">
              DSA Recall
            </span>
            <span className="text-[0.625rem] font-semibold text-[#8F8578] uppercase tracking-[0.08em] block mt-1">
              SPACED REVISION
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div>
          <span className="px-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#8F8578] block mb-2">
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
                  className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold no-underline transition-all duration-150 ${
                    active
                      ? 'bg-white/75 text-[#4E3924] shadow-[0_2px_8px_rgba(70,50,30,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] border border-white/80 backdrop-blur-md font-bold'
                      : 'text-[#635A4F] hover:bg-white/45 hover:text-[#231E18] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 pl-0.5">
                    <Icon
                      size={16}
                      className={active ? 'text-[#543E26]' : 'text-[#8F8578] group-hover:text-[#635A4F]'}
                    />
                    <span>{label}</span>
                  </div>

                  {badge !== null && (
                    <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[0.6875rem] font-bold bg-white/80 text-[#543E26] border border-white/90 shadow-xs min-w-[20px]">
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
          <span className="px-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#8F8578] block mb-2">
            DATA
          </span>
          <div className="space-y-1">
            <Link
              href="/settings"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold no-underline transition-all duration-150 ${
                pathname === '/settings'
                  ? 'bg-white/75 text-[#4E3924] shadow-[0_2px_8px_rgba(70,50,30,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] border border-white/80 backdrop-blur-md font-bold'
                  : 'text-[#635A4F] hover:bg-white/45 hover:text-[#231E18] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 pl-0.5">
                <Settings
                  size={16}
                  className={pathname === '/settings' ? 'text-[#543E26]' : 'text-[#8F8578]'}
                />
                <span>Settings</span>
              </div>
            </Link>

            <button
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-[#635A4F] hover:bg-white/45 hover:text-[#231E18] transition-all duration-150 border border-transparent"
              onClick={onOpenBackup}
            >
              <div className="flex items-center gap-2.5 pl-0.5">
                <Download size={16} className="text-[#8F8578]" />
                <span>Backup / Export</span>
              </div>
            </button>

            <div className="flex items-center justify-between px-3 py-2 text-xs text-[#635A4F]">
              <span className="pl-0.5 text-xs">Local Storage</span>
              <span className="flex items-center gap-1.5 font-bold text-[#526844] text-[0.6875rem]">
                <span className="h-2 w-2 rounded-full bg-[#526844] shadow-[0_0_6px_rgba(82,104,68,0.5)]" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer: macOS Frosted Widget with Leaf Motif */}
      <div className="p-3.5 border-t border-[rgba(255,255,255,0.5)]">
        <div className="rounded-xl border border-white/70 bg-white/45 p-3 flex items-center justify-between gap-2 shadow-[inset_0_1px_1px_#fff,0_2px_8px_rgba(70,50,30,0.03)] backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="text-xl select-none" role="img" aria-label="sprout">
              🌿
            </span>
            <div className="text-[0.6875rem] font-bold text-[#543E26] leading-snug">
              <span>Keep Learning</span>
              <span className="block text-[#8F8578] font-normal">Keep Growing</span>
            </div>
          </div>
          <Link
            href="/questions"
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-[#543E26] border border-white/90 shadow-xs hover:bg-[#543E26] hover:text-white transition-colors"
            title="Browse all questions"
          >
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
