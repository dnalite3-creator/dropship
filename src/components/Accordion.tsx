import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export interface AccordionItem {
  label: string;
  content: ReactNode;
}

interface Props {
  items: AccordionItem[];
  defaultOpen?: number;
}

export default function Accordion({ items, defaultOpen = -1 }: Props) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={cn(i > 0 && 'border-t border-zinc-200 dark:border-zinc-800')}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
            >
              {it.label}
              <ChevronDown className={cn('h-4 w-4 text-zinc-500 transition-transform', isOpen && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{it.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
