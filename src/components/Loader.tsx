import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Loader({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-zinc-400', className)}>
      <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
