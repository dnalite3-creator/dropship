import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { money, categoryLabel } from '../lib/utils';

interface Props {
  onPick?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ onPick, autoFocus }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await api.products({ q: q.trim(), limit: 6 });
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pick = (p: Product) => {
    setOpen(false);
    setQ('');
    onPick?.();
    navigate(`/product/${p.id}`);
  };

  const viewAll = () => {
    setOpen(false);
    onPick?.();
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-100 px-4 py-2 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/30 dark:border-zinc-700 dark:bg-zinc-800/80">
        <Search className="h-4 w-4 text-zinc-400" />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim()) viewAll();
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search accessories…  (press /)"
          className="w-full bg-transparent text-sm text-zinc-800 placeholder-zinc-400 outline-none dark:text-zinc-100"
        />
        {q && (
          <button onClick={() => { setQ(''); setResults([]); }} className="text-zinc-400 hover:text-zinc-600" aria-label="Clear">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {loading && <div className="px-4 py-3 text-sm text-zinc-400">Searching…</div>}
          {!loading && results.length === 0 && q.trim() && (
            <div className="px-4 py-3 text-sm text-zinc-400">No matches for “{q}”.</div>
          )}
          {!loading &&
            results.map((p) => (
              <button key={p.id} onClick={() => pick(p)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <img src={p.images?.[0]?.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.title}</p>
                  <p className="text-xs text-zinc-400">{categoryLabel(p.category)}</p>
                </div>
                <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{money(p.price)}</span>
              </button>
            ))}
          {!loading && q.trim() && (
            <button onClick={viewAll} className="block w-full border-t border-zinc-200 px-4 py-2.5 text-center text-xs font-semibold text-cyan-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-cyan-400 dark:hover:bg-zinc-800/50">
              View all results for “{q}” →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
