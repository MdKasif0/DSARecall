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
  Download,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import { getTodayISO, isCheckpointCompleted } from '@/lib/dates';
import { REVISION_INTERVALS, REVISION_KEYS } from '@/lib/types';
import { openAddModal } from '@/lib/events';

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
      badgeColor: '',
    },
    {
      href: '/questions',
      label: 'Questions',
      icon: List,
      badge: questions.length > 0 ? questions.length : null,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      href: '/today',
      label: "Today's Revisions",
      icon: CalendarCheck,
      badge: dueTodayCount > 0 ? dueTodayCount : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      href: '/upcoming',
      label: 'Upcoming',
      icon: CalendarClock,
      badge: upcomingCount > 0 ? upcomingCount : null,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      href: '/overdue',
      label: 'Overdue',
      icon: AlertCircle,
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-danger-light text-danger font-bold',
    },
  ];

  return (
    <aside className="desktop-sidebar hide-mobile" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <BookOpen size={15} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-text block leading-none">
              DSA Recall
            </span>
            <span className="text-[0.625rem] text-text-muted uppercase tracking-wider block mt-0.5">
              Spaced Revision
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <span className="px-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted block mb-1.5">
            Navigation
          </span>
          <nav className="space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon, badge, badgeColor }) => {
              const active =
                href === '/'
                  ? pathname === '/'
                  : pathname === href || (href === '/upcoming' && pathname === '/revisions');

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium no-underline transition-colors ${
                    active
                      ? 'bg-primary-light text-primary font-semibold'
                      : 'text-text-muted hover:bg-slate-100 hover:text-text'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      size={15}
                      className={active ? 'text-primary' : 'text-slate-500'}
                    />
                    <span>{label}</span>
                  </div>
                  {badge !== null && (
                    <span
                      className={`inline-flex items-center justify-center rounded px-1.5 py-0.2 text-[0.6875rem] min-w-[18px] ${badgeColor}`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Action */}
        <div>
          <button
            className="btn btn-primary btn-sm w-full justify-center"
            onClick={openAddModal}
          >
            <Plus size={14} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Footer Tools */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          className="btn btn-secondary btn-sm w-full justify-start text-xs text-text-muted hover:text-text"
          onClick={onOpenBackup}
        >
          <Download size={13} />
          <span>Backup / Export</span>
        </button>

        <div className="px-2 pt-1 flex items-center justify-between text-[0.6875rem] text-text-muted">
          <span>Local Storage</span>
          <span className="font-semibold text-primary">Active</span>
        </div>
      </div>
    </aside>
  );
}
