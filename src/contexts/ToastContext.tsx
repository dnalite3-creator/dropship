import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface ToastItem {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
  undo?: () => void;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (message: string, opts?: { kind?: ToastItem['kind']; undo?: () => void; duration?: number }) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>((message, opts = {}) => {
    const id = nextId++;
    const item: ToastItem = { id, message, kind: opts.kind || 'info', undo: opts.undo };
    setToasts((t) => [...t, item]);
    const duration = opts.duration ?? (opts.undo ? 7000 : 4000);
    window.setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
