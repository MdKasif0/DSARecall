'use client';

import { useEffect, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="modal-content max-w-sm !p-0 overflow-hidden shadow-[0_24px_64px_rgba(15,23,42,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.95)] border border-white/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-700 border border-rose-500/25 shadow-xs">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <h3 id="confirm-dialog-title" className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">{message}</p>
          <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-white/60">
            <button
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
              autoFocus
            >
              Cancel
            </button>
            <button className="btn btn-danger btn-sm" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
