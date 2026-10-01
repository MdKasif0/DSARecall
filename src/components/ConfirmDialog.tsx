'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
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
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-light">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <h3 className="text-base font-semibold text-text">{title}</h3>
          <p className="mt-1 text-sm text-text-muted">{message}</p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button className="btn btn-secondary btn-sm" onClick={onCancel}>
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
