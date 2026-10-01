'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  List,
  CalendarCheck,
  Compass,
  Trophy,
  Settings,
  Plus,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import { getTodayISO, isCheckpointCompleted } from '@/lib/dates';
import { REVISION_INTERVALS, REVISION_KEYS } from '@/lib/types';
import { openAddModal } from '@/lib/events';

export default function MobileNav() {
  const pathname = usePathname();
  const { questions, recordsMap } = useQuestions();

  const today = getTodayISO();

  let dueTodayCount = 0;

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const d = q[REVISION_KEYS[interval]];
      if (d === today) {
        dueTodayCount++;
      }
    }
  }

  const items = [
    {
      href: '/',
      label: 'Home',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      href: '/questions',
      label: 'Questions',
      icon: List,
      badge: 0,
    },
    {
      href: '/practice',
      label: 'Practice',
      icon: Compass,
      badge: 0,
    },
    {
      href: '/today',
      label: 'Today',
      icon: CalendarCheck,
      badge: dueTodayCount,
    },
    {
      href: '/achievements',
      label: 'Trophies',
      icon: Trophy,
      badge: 0,
    },
  ];

  return (
    <>
      {/* Compact Mobile Top Header */}
      <header className="show-mobile-only sticky top-0 z-30 border-b border-border bg-[#FBF8F2] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5F4930] shadow-xs">
              <BookOpen size={14} className="text-[#FFFDF9]" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#29251F] leading-none block">
                DSA Recall
              </span>
              <span className="text-[0.5625rem] font-semibold text-[#9A9287] uppercase tracking-[0.08em] block mt-0.5">
                SPACED REVISION
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4DDD2] bg-[#FFFDF9] text-[#71695F] hover:bg-[#F2ECE2]"
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={15} />
            </Link>
            <button
              className="btn btn-primary btn-sm px-2.5 py-1 text-xs"
              onClick={openAddModal}
              aria-label="Add Question"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Fixed Mobile Bottom Bar */}
      <nav className="mobile-bottom-nav show-mobile-only bg-[#FFFDF9] border-t border-[#E4DDD2]" aria-label="Mobile Navigation">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname === href || (href === '/upcoming' && pathname === '/revisions');

          return (
            <Link
              key={href}
              href={href}
              className={`mobile-bottom-item ${active ? 'active' : ''}`}
            >
              <div className="relative">
                <Icon size={18} className={active ? 'text-[#5F4930]' : 'text-[#9A9287]'} />
                {badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[0.625rem] font-bold text-white ${
                      label === 'Overdue' ? 'bg-[#A65D50]' : 'bg-[#B18A50]'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span className={active ? 'text-[#5F4930] font-bold' : 'text-[#71695F]'}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
