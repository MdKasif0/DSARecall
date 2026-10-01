'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  List,
  CalendarCheck,
  CalendarClock,
  AlertCircle,
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
  let overdueCount = 0;

  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const d = q[REVISION_KEYS[interval]];
      if (d === today) {
        dueTodayCount++;
      } else if (d < today) {
        overdueCount++;
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
      href: '/today',
      label: 'Today',
      icon: CalendarCheck,
      badge: dueTodayCount,
    },
    {
      href: '/upcoming',
      label: 'Upcoming',
      icon: CalendarClock,
      badge: 0,
    },
    {
      href: '/overdue',
      label: 'Overdue',
      icon: AlertCircle,
      badge: overdueCount,
    },
  ];

  return (
    <>
      {/* Compact Mobile Top Header */}
      <header className="show-mobile-only sticky top-0 z-30 border-b border-border bg-surface px-4 py-2.5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-text">DSA Recall</span>
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
      </header>

      {/* Fixed Mobile Bottom Bar */}
      <nav className="mobile-bottom-nav show-mobile-only" aria-label="Mobile Navigation">
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
                <Icon size={18} />
                {badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[0.625rem] font-bold text-white ${
                      label === 'Overdue' ? 'bg-danger' : 'bg-[#B45309]'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
