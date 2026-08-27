import { Check, Package, Truck, MapPin, Home, Ban } from 'lucide-react';
import { cn } from '../lib/utils';

const STEPS = [
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

export default function TrackingTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
        <Ban className="h-4 w-4" /> Order cancelled
      </div>
    );
  }
  const order = ['processing', 'shipped', 'out_for_delivery', 'delivered'];
  const current = Math.max(0, order.indexOf(status));
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 transition', done ? 'border-cyan-500 bg-cyan-500 text-white' : active ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'border-zinc-300 text-zinc-400 dark:border-zinc-700')}>
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={cn('text-[10px] font-medium sm:text-xs', active || done ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-400')}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn('mx-2 h-0.5 flex-1 rounded-full', i < current ? 'bg-cyan-500' : 'bg-zinc-200 dark:bg-zinc-800')} />}
          </div>
        );
      })}
    </div>
  );
}
