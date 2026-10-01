export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;

const listeners: Set<ToastListener> = new Set();

export const toast = {
  subscribe(fn: ToastListener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  show(message: string, type: ToastType = 'info', duration: number = 3500) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toastItem: ToastMessage = { id, message, type, duration };
    listeners.forEach((fn) => fn(toastItem));
  },
  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  },
  error(message: string, duration?: number) {
    this.show(message, 'error', duration ?? 5000);
  },
  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  },
};
