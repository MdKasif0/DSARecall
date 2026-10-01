'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { toast, type ToastMessage } from '@/lib/toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration ?? 3500);

      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((item) => {
        let icon = <Info size={16} className="text-secondary shrink-0" />;
        let borderClass = 'border-border bg-surface text-text';

        if (item.type === 'success') {
          icon = <CheckCircle2 size={16} className="text-primary shrink-0" />;
          borderClass = 'border-primary/20 bg-surface text-text shadow-md';
        } else if (item.type === 'error') {
          icon = <AlertCircle size={16} className="text-danger shrink-0" />;
          borderClass = 'border-danger/20 bg-surface text-text shadow-md';
        }

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 rounded-lg border p-3 text-xs shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium">{item.message}</span>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="btn-icon btn-ghost p-1 text-text-muted hover:text-text"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
