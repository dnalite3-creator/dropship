import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Undo2, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 p-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? XCircle : Info;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg backdrop-blur',
                t.kind === 'success'
                  ? 'border-emerald-500/30 bg-emerald-50/95 dark:bg-emerald-950/90'
                  : t.kind === 'error'
                  ? 'border-rose-500/30 bg-rose-50/95 dark:bg-rose-950/90'
                  : 'border-zinc-300 bg-white/95 dark:border-zinc-700 dark:bg-zinc-900/95'
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  t.kind === 'success' ? 'text-emerald-500' : t.kind === 'error' ? 'text-rose-500' : 'text-cyan-500'
                )}
              />
              <p className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{t.message}</p>
              {t.undo && (
                <button
                  onClick={() => {
                    t.undo?.();
                    dismiss(t.id);
                  }}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400"
                >
                  <Undo2 className="mr-1 inline h-3.5 w-3.5" />
                  Undo
                </button>
              )}
              <button onClick={() => dismiss(t.id)} className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
