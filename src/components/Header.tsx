'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  List,
  CalendarCheck,
  Plus,
  Menu,
  X,
} from 'lucide-react';
import { formatTodayLong } from '@/lib/dates';

interface HeaderProps {
  onAddClick: () => void;
}

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/questions', label: 'Questions', icon: List },
  { href: '/revisions', label: "Today's Revisions", icon: CalendarCheck },
];

export default function Header({ onAddClick }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            {navLinks.map(({ href, label, icon: Icon }) => {
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
                  {label}
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
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors ${
                      active
                        ? 'bg-primary-light text-primary'
                        : 'text-text-muted hover:bg-bg hover:text-text'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
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
