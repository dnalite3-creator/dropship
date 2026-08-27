import { useEffect, useState } from 'react';
import { LayoutDashboard, Star, Package, RefreshCw, Check, X, Trash2, DollarSign, ShoppingCart, TrendingUp, BadgeCheck, Loader2, ShoppingBag } from 'lucide-react';
import { api } from '../lib/api';
import type { Order, Product, Review } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { money, formatDate, cn } from '../lib/utils';
import Loader from '../components/Loader';
import TrackingTimeline from '../components/TrackingTimeline';

type Tab = 'overview' | 'reviews' | 'orders' | 'catalog';

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalReviews: number;
  pendingReviews: number;
  statusBreakdown: Record<string, number>;
  recentOrders: Order[];
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'all'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [edits, setEdits] = useState<Record<number, { price?: string; stock?: string }>>({});

  const loadAnalytics = () => api.admin.analytics().then(setAnalytics).catch(() => {});
  const loadReviews = () => api.admin.reviews(reviewFilter).then(setReviews).catch(() => setReviews([]));
  const loadOrders = () => api.admin.orders().then(setOrders).catch(() => setOrders([]));
  const loadProducts = () => api.admin.products().then(setProducts).catch(() => setProducts([]));

  useEffect(() => { loadAnalytics(); loadOrders(); loadProducts(); loadReviews(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { loadReviews(); /* eslint-disable-next-line */ }, [reviewFilter]);

  const refreshTab = async (t: Tab) => {
    setTab(t);
    setLoading(true);
    try {
      if (t === 'overview') await loadAnalytics();
      if (t === 'reviews') await loadReviews();
      if (t === 'orders') await loadOrders();
      if (t === 'catalog') await loadProducts();
    } finally { setLoading(false); }
  };

  const onReviewAction = async (id: number, action: 'approved' | 'rejected' | 'delete') => {
    try {
      if (action === 'delete') await api.admin.deleteReview(id);
      else await api.admin.updateReview(id, action);
      toast(action === 'approved' ? 'Review approved' : action === 'rejected' ? 'Review rejected' : 'Review deleted', { kind: 'success' });
      await loadReviews(); await loadAnalytics();
    } catch {
      toast('Action failed', { kind: 'error' });
    }
  };

  const onOrderStatus = async (id: number, delivery_status: string) => {
    try { await api.admin.updateOrder(id, delivery_status); await loadOrders(); await loadAnalytics(); toast('Order status updated', { kind: 'success' }); }
    catch { toast('Update failed', { kind: 'error' }); }
  };

  const onSync = async () => {
    setSyncing(true);
    try { const r = await api.admin.sync(); toast(r?.message || 'Catalog synced', { kind: 'success' }); await loadProducts(); await loadAnalytics(); }
    catch { toast('Sync failed', { kind: 'error' }); }
    finally { setSyncing(false); }
  };

  const saveProduct = async (p: Product) => {
    const e = edits[p.id] || {};
    const updates: { price?: number; stock?: number } = {};
    if (e.price !== undefined && e.price !== '') updates.price = Number(e.price);
    if (e.stock !== undefined && e.stock !== '') updates.stock = Number(e.stock);
    if (!Object.keys(updates).length) { toast('Nothing to save', { kind: 'info' }); return; }
    try { await api.admin.updateProduct(p.id, updates); toast('Product updated', { kind: 'success' }); setEdits((s) => ({ ...s, [p.id]: {} })); await loadProducts(); }
    catch { toast('Update failed', { kind: 'error' }); }
  };

  const TABS: [Tab, string, any][] = [
    ['overview', 'Overview', LayoutDashboard],
    ['reviews', 'Reviews', Star],
    ['orders', 'Orders', Package],
    ['catalog', 'Catalog', ShoppingBag],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500"><TrendingUp className="h-5 w-5" /></span>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Signed in as {user?.email}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map(([key, label, Icon]) => (
          <button key={key} onClick={() => refreshTab(key)} className={cn('flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition', tab === key ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200')}><Icon className="h-4 w-4" /> {label}</button>
        ))}
      </div>

      {tab === 'overview' && (analytics ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={DollarSign} label="Total revenue" value={money(analytics.totalRevenue)} />
            <StatCard icon={ShoppingCart} label="Total orders" value={String(analytics.totalOrders)} />
            <StatCard icon={Package} label="Products" value={String(analytics.totalProducts)} />
            <StatCard icon={Star} label="Pending reviews" value={String(analytics.pendingReviews)} highlight={analytics.pendingReviews > 0} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Orders by status</h3>
              <div className="space-y-2">
                {['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => {
                  const count = analytics.statusBreakdown[s] || 0;
                  const total = analytics.totalOrders || 1;
                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-28 capitalize text-zinc-500">{s.replace(/_/g, ' ')}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${(count / total) * 100}%` }} /></div>
                      <span className="w-8 text-right text-zinc-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Recent orders</h3>
              <div className="space-y-2">
                {(analytics.recentOrders || []).slice(0, 6).map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <div><p className="font-medium text-zinc-800 dark:text-zinc-200">#{o.id} · {o.customer_email}</p><p className="text-xs text-zinc-400">{formatDate(o.created_at)} · {o.delivery_status.replace(/_/g, ' ')}</p></div>
                    <span className="font-semibold">{money(o.total_paid)}</span>
                  </div>
                ))}
                {(!analytics.recentOrders || analytics.recentOrders.length === 0) && <p className="text-sm text-zinc-400">No orders yet.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : <Loader />)}

      {tab === 'reviews' && (
        <div>
          <div className="mb-4 flex gap-2">
            {(['pending', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setReviewFilter(f)} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium capitalize', reviewFilter === f ? 'bg-cyan-500 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300')}>{f} reviews</button>
            ))}
          </div>
          {loading ? <Loader /> : reviews.length === 0 ? <p className="py-12 text-center text-sm text-zinc-400">No {reviewFilter} reviews.</p> : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><p className="text-sm font-semibold text-zinc-900 dark:text-white">{r.author_name}</p>{r.is_verified_delivery && <BadgeCheck className="h-4 w-4 text-emerald-500" />}<span className="truncate text-xs text-zinc-400">on {r.product_title}</span></div>
                      <p className="mt-1 text-xs text-amber-500">{'★'.repeat(r.rating)}<span className="text-zinc-300">{'★'.repeat(5 - r.rating)}</span></p>
                      {r.comment && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{r.comment}</p>}
                      <p className="mt-1 text-xs text-zinc-400">{formatDate(r.created_at)} · status: <span className={cn('font-medium', r.status === 'approved' ? 'text-emerald-500' : r.status === 'rejected' ? 'text-rose-500' : 'text-amber-500')}>{r.status}</span></p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {r.status !== 'approved' && <button onClick={() => onReviewAction(r.id, 'approved')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" title="Approve"><Check className="h-4 w-4" /></button>}
                      {r.status !== 'rejected' && <button onClick={() => onReviewAction(r.id, 'rejected')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" title="Reject"><X className="h-4 w-4" /></button>}
                      <button onClick={() => onReviewAction(r.id, 'delete')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (loading ? <Loader /> : orders.length === 0 ? <p className="py-12 text-center text-sm text-zinc-400">No orders yet.</p> : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">#{o.id} · {o.customer_email}</p>
                  <p className="text-xs text-zinc-400">{formatDate(o.created_at)} · {money(o.total_paid)}{o.cj_order_id ? ` · CJ: ${o.cj_order_id}` : ''}</p>
                </div>
                <select value={o.delivery_status} onChange={(e) => onOrderStatus(o.id, e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm capitalize dark:border-zinc-700 dark:bg-zinc-950">
                  {['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="mt-3"><TrackingTimeline status={o.delivery_status} /></div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                {(o.items || []).map((it) => <span key={it.id} className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">{it.product_title} ×{it.quantity}</span>)}
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'catalog' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{products.length} products</p>
            <button onClick={onSync} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-60">{syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync from CJ</button>
          </div>
          {loading ? <Loader /> : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price ($)</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3"></th></tr></thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><img src={p.images?.[0]?.url} alt="" className="h-8 w-8 rounded object-cover" /><span className="font-medium text-zinc-800 dark:text-zinc-200">{p.title}</span></div></td>
                      <td className="px-4 py-3 text-zinc-500">{p.category}</td>
                      <td className="px-4 py-3"><input type="number" defaultValue={p.price} onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...(s[p.id] || {}), price: e.target.value } }))} className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" /></td>
                      <td className="px-4 py-3"><input type="number" defaultValue={p.stock} onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...(s[p.id] || {}), stock: e.target.value } }))} className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" /></td>
                      <td className="px-4 py-3"><button onClick={() => saveProduct(p)} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:text-zinc-950">Save</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-2xl border bg-white p-5 dark:bg-zinc-900', highlight ? 'border-amber-500/40' : 'border-zinc-200 dark:border-zinc-800')}>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', highlight ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500')}><Icon className="h-5 w-5" /></span>
      <p className="mt-3 text-2xl font-extrabold text-zinc-900 dark:text-white">{value}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
