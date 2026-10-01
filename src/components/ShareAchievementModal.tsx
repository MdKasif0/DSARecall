'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import type { Achievement } from '@/lib/achievements';
import { generateTwitterShareUrl, generateLinkedInShareUrl } from '@/lib/achievements';
import { toast } from '@/lib/toast';

interface ShareAchievementModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function ShareAchievementModal({
  achievement,
  onClose,
}: ShareAchievementModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!achievement) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [achievement, onClose]);

  if (!achievement) return null;

  const twitterUrl = generateTwitterShareUrl(achievement);
  const linkedInUrl = generateLinkedInShareUrl(achievement);

  const fullShareText = `${achievement.shareTitle}\n\n${achievement.shareMessage}\n\nTrack your spaced repetition cycle with DSA Recall: https://dsarecall.app`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      toast.success('Share text copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy text.');
    }
  };

  const tierColors: Record<Achievement['tier'], { badge: string; border: string }> = {
    bronze: { badge: 'bg-[#F2ECE2] text-[#8B6F47]', border: 'border-[#E4DDD2]' },
    silver: { badge: 'bg-[#F1E9DE] text-[#5F4930]', border: 'border-[#D5CCBF]' },
    gold: { badge: 'bg-[#EDE1CF] text-[#795B39]', border: 'border-[#B18A50]' },
    platinum: { badge: 'bg-[#E8EDE4] text-[#65755D]', border: 'border-[#6F8064]' },
  };

  const tierStyle = tierColors[achievement.tier];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${achievement.title}`}
    >
      <div
        className="modal-content max-w-lg p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5F4930] text-[#FFFDF9]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Share Your Milestone</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Inspire your network on LinkedIn or Twitter / X
              </p>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-[#F1E9DE] hover:text-text transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Milestone Visual Card */}
        <div className={`rounded-xl border ${tierStyle.border} bg-[#FAF7F2] p-5 text-center space-y-3 shadow-xs`}>
          <div className="text-4xl select-none" role="img" aria-label={achievement.title}>
            {achievement.icon}
          </div>
          <div>
            <div className="inline-block mb-1">
              <span className={`rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.08em] ${tierStyle.badge}`}>
                {achievement.tier} Achievement
              </span>
            </div>
            <h3 className="text-lg font-bold text-text">{achievement.title}</h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              {achievement.description}
            </p>
          </div>
        </div>

        {/* Formatted post preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>Post Preview</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[0.6875rem] font-bold text-[#8B6F47] hover:underline"
            >
              {copied ? <Check size={12} className="text-[#6F8064]" /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Copy snippet'}</span>
            </button>
          </div>
          <div className="rounded-lg border border-border bg-[#FFFDF9] p-3 text-xs text-[#29251F] font-mono leading-relaxed whitespace-pre-wrap select-all">
            {fullShareText}
          </div>
        </div>

        {/* 1-Click Social Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {/* Twitter / X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm flex items-center justify-center gap-2 py-2 text-xs font-bold no-underline hover:border-[#29251F]"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Share on Twitter / X</span>
            <ExternalLink size={12} className="text-text-muted" />
          </a>

          {/* LinkedIn */}
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCopy}
            className="btn btn-primary btn-sm flex items-center justify-center gap-2 py-2 text-xs font-bold no-underline"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25a1.62 1.62 0 0 0-1.63 1.63 1.63 1.63 0 0 0 1.63 1.63 1.63 1.63 0 0 0 1.63-1.63c0-.9-.73-1.63-1.63-1.63Z" />
            </svg>
            <span>Share on LinkedIn</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
