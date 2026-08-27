import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }: Props) {
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(btn, 'flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-40 hover:text-cyan-500')}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn('min-w-8 text-center text-sm font-semibold', size === 'sm' && 'min-w-6 text-xs')}>{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(btn, 'flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-40 hover:text-cyan-500')}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
