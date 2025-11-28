import { createContext, useCallback, useContext, useMemo, useState, type FC, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const genId = () => Math.random().toString(36).slice(2, 9);

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = genId();
    const t: Toast = { id, duration: 3500, ...toast };
    setToasts((prev) => [...prev, t]);
    if (t.duration && t.duration > 0) {
      window.setTimeout(() => removeToast(id), t.duration);
    }
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-96 max-w-[calc(100%-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur',
              t.type === 'success' ? 'border-green-200 bg-green-50/90 text-green-800' : '',
              t.type === 'error' ? 'border-red-200 bg-red-50/90 text-red-800' : '',
              t.type === 'info' ? 'border-blue-200 bg-blue-50/90 text-blue-800' : '',
            ].join(' ')}
          >
            <div className="flex-1">
              {t.title && <h4 className="font-semibold">{t.title}</h4>}
              {t.message && <p className="text-sm opacity-90">{t.message}</p>}
            </div>
            <button onClick={() => removeToast(t.id)} className="opacity-50 hover:opacity-100">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
};
