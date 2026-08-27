import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  value?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  count?: number;
  className?: string;
}

export default function StarRating({ value = 0, size = 16, interactive = false, onChange, count, className }: Props) {
  const filled = Math.round(value);
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i)}
          className={cn(interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default', 'p-0.5')}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(i <= filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-zinc-300 dark:text-zinc-600')}
          />
        </button>
      ))}
      {count !== undefined && <span className="ml-1.5 text-xs text-zinc-400">({count})</span>}
    </div>
  );
}
