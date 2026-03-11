import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react';
import { setGlobalToastError } from '../utils/toastBridge';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = 'info', duration = DEFAULT_DURATION) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }, [remove]);

  const success = useCallback((message: string, duration = DEFAULT_DURATION) => show(message, 'success', duration), [show]);
  const error = useCallback((message: string, duration = DEFAULT_DURATION) => show(message, 'error', duration), [show]);
  const info = useCallback((message: string, duration = DEFAULT_DURATION) => show(message, 'info', duration), [show]);

  useEffect(() => {
    setGlobalToastError((msg) => error(msg));
    return () => setGlobalToastError(null);
  }, [error]);

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
        ))}
      </div>
    </div>
  );
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const isSuccess = item.type === 'success';
  const isError = item.type === 'error';
  const bg = isError ? 'bg-red-600' : isSuccess ? 'bg-emerald-600' : 'bg-slate-800';
  const icon = isError ? (
    <svg className="w-5 h-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ) : isSuccess ? (
    <svg className="w-5 h-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-5 h-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div
      className={`${bg} text-white rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 toast-in`}
      role="alert"
    >
      {icon}
      <p className="flex-1 text-sm font-medium leading-snug pt-0.5">{item.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition opacity-90 hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 101.06 1.06L10 11.06l2.72 2.72a.75.75 0 101.06-1.06L11.06 10l2.72-2.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
