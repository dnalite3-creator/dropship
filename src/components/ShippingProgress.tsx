import { Truck } from 'lucide-react';
import { money, FREE_SHIPPING_THRESHOLD } from '../lib/utils';

export default function ShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const unlocked = subtotal >= FREE_SHIPPING_THRESHOLD;
  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-500/20 dark:bg-cyan-500/10">
      <div className="flex items-center gap-2 text-xs font-medium text-cyan-800 dark:text-cyan-300">
        <Truck className="h-4 w-4 shrink-0" />
        {unlocked ? (
          <span>You've unlocked FREE shipping!</span>
        ) : (
          <span>
            Add <span className="font-bold">{money(remaining)}</span> for FREE shipping
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cyan-200 dark:bg-cyan-500/20">
        <div className="h-full rounded-full bg-cyan-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
