import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { Order, Product } from '../lib/types';
import { useWishlist } from '../store/wishlist';
import { money, formatDate, cn } from '../lib/utils';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import TrackingTimeline from '../components/TrackingTimeline';
import ProductCard from '../components/ProductCard';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const wishlistIds = useWishlist((s) => s.ids);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishProducts, setWishProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'wishlist'>('orders');

  useEffect(() => {
    api.orders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (wishlistIds.length === 0) { setWishProducts([]); return; }
    Promise.all(wishlistIds.map((id) => api.product(id).catch(() => null))).then((r) => setWishProducts(r.filter(Boolean) as Product[]));
  }, [wishlistIds]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-bold text-white">{(user?.email || 'U').charAt(0).toUpperCase()}</div>
          <div><h1 className="text-xl font-bold text-zinc-900 dark:text-white">My account</h1><p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p></div>
        </div>
        {isAdmin && <Link to="/admin" className="rounded-xl border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400">Admin Panel →</Link>}
      </div>

      <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {([['orders', 'Orders', Package], ['wishlist', 'Wishlist', Heart]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={cn('flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition', tab === key ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200')}><Icon className="h-4 w-4" /> {label}{key === 'wishlist' && wishlistIds.length > 0 ? ` (${wishlistIds.length})` : ''}</button>
        ))}
      </div>

      {tab === 'orders' ? (
        loading ? <Loader label="Loading your orders…" /> : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders yet" message="When you place an order it will appear here with live tracking." action={<Link to="/products" className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white">Start shopping</Link>} />
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Order #{o.id}</p>
                    <p className="text-xs text-zinc-400">Placed {formatDate(o.created_at)} · {o.items?.length || 0} item(s)</p>
                    {o.cj_order_id && <p className="mt-0.5 text-xs text-cyan-600 dark:text-cyan-400">CJ ref: {o.cj_order_id}</p>}
                    {o.tracking_number && <p className="text-xs text-zinc-500">Tracking: {o.tracking_number}</p>}
                  </div>
                  <span className="text-base font-bold text-zinc-900 dark:text-white">{money(o.total_paid)}</span>
                </div>
                <div className="my-4"><TrackingTimeline status={o.delivery_status} /></div>
                <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  {(o.items || []).map((it) => (
                    <div key={it.id} className="flex items-center gap-3 text-sm"><img src={it.image || ''} alt="" className="h-10 w-10 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-medium text-zinc-800 dark:text-zinc-200">{it.product_title}</p>{it.variant && <p className="text-xs text-zinc-400">{it.variant}</p>}</div><span className="text-zinc-400">×{it.quantity}</span><span className="font-semibold">{money(it.price * it.quantity)}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : wishProducts.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" message="Tap the heart on any product to save it for later." action={<Link to="/products" className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white">Browse accessories</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{wishProducts.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}
