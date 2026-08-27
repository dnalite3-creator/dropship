import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface Props {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-7 w-7 text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {message && <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{message}</p>}
      {action}
    </div>
  );
}
