import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, LayoutGrid, List, X, ShoppingBag } from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { CATEGORIES, categoryLabel, money, cn } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useCart } from '../store/cart';
import { useToast } from '../contexts/ToastContext';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minInput, setMinInput] = useState(params.get('min') || '');
  const [maxInput, setMaxInput] = useState(params.get('max') || '');
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();

  const category = params.get('category') || 'all';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'newest';

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all' || (key === 'sort' && value === 'newest')) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const applyPrice = () => {
    const next = new URLSearchParams(params);
    if (minInput) next.set('min', minInput); else next.delete('min');
    if (maxInput) next.set('max', maxInput); else next.delete('max');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    api.products({ category: category !== 'all' ? category : undefined, q: q || undefined, sort, min: params.get('min') || undefined, max: params.get('max') || undefined, limit: 100 })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, q, sort, params]);

  const addQuick = (p: Product) => {
    if (p.stock <= 0) return;
    const variant = p.variants?.length ? p.variants.map((v) => v.options[0]).join(' / ') : null;
    addItem({ product_id: p.id, title: p.title, price: p.price, image: p.images?.[0]?.url || null, quantity: 1, variant, cj_product_id: p.cj_product_id, stock: p.stock });
    toast(`${p.title} added to cart`, { kind: 'success' });
  };

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Category</h3>
        <div className="space-y-1.5">
          {[{ slug: 'all', label: 'All accessories' }, ...CATEGORIES].map((c) => (
            <button key={c.slug} onClick={() => update('category', c.slug)} className={cn('block w-full rounded-lg px-3 py-2 text-left text-sm transition', category === c.slug ? 'bg-cyan-500/10 font-semibold text-cyan-600 dark:text-cyan-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800')}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Price range</h3>
        <div className="flex items-center gap-2">
          <input type="number" min="0" value={minInput} onChange={(e) => setMinInput(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === 'Enter' && applyPrice()} placeholder="Min" className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm outline-none focus:border-cyan-400 dark:border-zinc-700 dark:bg-zinc-900" />
          <span className="text-zinc-400">–</span>
          <input type="number" min="0" value={maxInput} onChange={(e) => setMaxInput(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === 'Enter' && applyPrice()} placeholder="Max" className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm outline-none focus:border-cyan-400 dark:border-zinc-700 dark:bg-zinc-900" />
        </div>
      </div>
      <button onClick={() => { setMinInput(''); setMaxInput(''); const next = new URLSearchParams(params); next.delete('min'); next.delete('max'); setParams(next, { replace: true }); }} className="text-xs text-zinc-500 hover:text-cyan-500">Clear filters</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{q ? `Results for “${q}”` : category !== 'all' ? categoryLabel(category) : 'All accessories'}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}</p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">{FilterPanel}</div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button onClick={() => setFiltersOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium lg:hidden dark:border-zinc-700"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
            <div className="flex items-center gap-2">
              <select value={sort} onChange={(e) => update('sort', e.target.value)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 dark:border-zinc-700 dark:bg-zinc-900">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div className="hidden items-center rounded-xl border border-zinc-300 dark:border-zinc-700 sm:flex">
                <button onClick={() => setView('grid')} className={cn('flex h-9 w-9 items-center justify-center', view === 'grid' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-zinc-400')} aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></button>
                <button onClick={() => setView('list')} className={cn('flex h-9 w-9 items-center justify-center', view === 'list' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-zinc-400')} aria-label="List view"><List className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {loading ? (
            <Loader label="Loading products…" />
          ) : products.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No products found" message="Try adjusting your filters or search terms." />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <img src={p.images?.[0]?.url} alt={p.title} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{categoryLabel(p.category)}</p>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{p.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{p.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-zinc-900 dark:text-white">{money(p.price)}</span>
                      <button onClick={() => addQuick(p)} disabled={p.stock <= 0} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-500 dark:text-zinc-950"><ShoppingBag className="h-4 w-4" /> Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white p-5 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
            </div>
            {FilterPanel}
            <button onClick={() => setFiltersOpen(false)} className="mt-6 w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white">Show {products.length} results</button>
          </div>
        </div>
      )}
    </div>
  );
}
