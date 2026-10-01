'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  List,
  CalendarCheck,
  CalendarClock,
  Plus,
  Menu,
  X,
} from 'lucide-react';
import { formatTodayLong, getTodayISO, isCheckpointCompleted } from '@/lib/dates';
import { useQuestions } from '@/lib/context';
import { REVISION_INTERVALS, REVISION_KEYS } from '@/lib/types';

interface HeaderProps {
  onAddClick: () => void;
}

export default function Header({ onAddClick }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { questions, recordsMap } = useQuestions();

  const today = getTodayISO();

  // Count items needing attention today or overdue
  let actionCount = 0;
  for (const q of questions) {
    for (const interval of REVISION_INTERVALS) {
      if (isCheckpointCompleted(q.id, interval, recordsMap)) continue;
      const d = q[REVISION_KEYS[interval]];
      if (d <= today) {
        actionCount++;
      }
    }
  }

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/today', label: 'Today', icon: CalendarCheck, badge: actionCount },
    { href: '/revisions', label: 'Upcoming', icon: CalendarClock },
    { href: '/questions', label: 'All Questions', icon: List },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Logo + hamburger */}
          <div className="flex items-center gap-3">
            <button
              className="btn-icon btn-ghost show-mobile-only"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="text-[0.9375rem] font-semibold text-text">
                DSA Recall
              </span>
            </Link>
          </div>

          {/* Center: Desktop navigation */}
          <nav className="hide-mobile flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium no-underline transition-colors ${
                    active
                      ? 'bg-primary-light text-primary'
                      : 'text-text-muted hover:bg-bg hover:text-text'
                  }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[0.6875rem] font-bold rounded-full bg-danger text-white min-w-[18px] h-[18px]">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Date + Add button */}
          <div className="flex items-center gap-3">
            <span className="hide-mobile text-xs text-text-muted">
              {formatTodayLong()}
            </span>
            <button className="btn btn-primary btn-sm" onClick={onAddClick}>
              <Plus size={15} />
              <span className="hide-mobile">Add Question</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-nav-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="mobile-nav-panel">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <BookOpen size={16} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-text">
                  DSA Recall
                </span>
              </div>
              <button
                className="btn-icon btn-ghost"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="p-3">
              {navLinks.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors ${
                      active
                        ? 'bg-primary-light text-primary'
                        : 'text-text-muted hover:bg-bg hover:text-text'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={18} />
                      <span>{label}</span>
                    </div>
                    {badge !== undefined && badge > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[0.6875rem] font-bold rounded-full bg-danger text-white min-w-[18px] h-[18px]">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border px-4 py-3">
              <p className="text-xs text-text-muted">{formatTodayLong()}</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
