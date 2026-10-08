import React, { useEffect } from 'react';
import { create } from 'zustand';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { id, message, type, duration }],
    }));
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Quick helper to show alerts without window.alert
export const notify = {
  info: (msg: string, duration?: number) => useToastStore.getState().showToast(msg, 'info', duration),
  success: (msg: string, duration?: number) => useToastStore.getState().showToast(msg, 'success', duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().showToast(msg, 'warning', duration),
  error: (msg: string, duration?: number) => useToastStore.getState().showToast(msg, 'error', duration),
};

export function NotificationToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-2"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

export const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    info: <Info size={18} className="text-sky-500 shrink-0" />,
    success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
    warning: <AlertCircle size={18} className="text-amber-500 shrink-0" />,
    error: <AlertCircle size={18} className="text-rose-500 shrink-0" />,
  };

  const bgStyles = {
    info: 'bg-white border-sky-300 text-slate-800 shadow-sky-100',
    success: 'bg-white border-emerald-300 text-slate-800 shadow-emerald-100',
    warning: 'bg-white border-amber-300 text-slate-800 shadow-amber-100',
    error: 'bg-white border-rose-300 text-slate-800 shadow-rose-100',
  };

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 shadow-lg transition-all transform animate-in fade-in slide-in-from-top-3 duration-200',
        bgStyles[toast.type]
      )}
    >
      <div className="flex items-center gap-2.5">
        {icons[toast.type]}
        <span className="text-xs sm:text-sm font-bold leading-tight">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        title="Dismiss"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
