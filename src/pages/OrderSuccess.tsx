import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import type { Order } from '../lib/types';
import { money, formatDate } from '../lib/utils';
import TrackingTimeline from '../components/TrackingTimeline';
import Loader from '../components/Loader';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders()
      .then((orders) => {
        const found = id ? orders.find((o) => String(o.id) === String(id)) : orders[0];
        setOrder(found || null);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Confirming your order…" className="min-h-[60vh]" />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">Order confirmed!</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">A confirmation has been sent to your email. Your order is being fulfilled via CJ Dropshipping.</p>
      </div>

      {order && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Order #{order.id}</p>
              <p className="text-xs text-zinc-400">{formatDate(order.created_at)}</p>
            </div>
            {order.cj_order_id && <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">CJ: {order.cj_order_id}</span>}
          </div>
          <div className="my-5"><TrackingTimeline status={order.delivery_status} /></div>
          <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {(order.items || []).map((it) => (
              <div key={it.id} className="flex items-center gap-3 text-sm">
                <img src={it.image || ''} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate font-medium text-zinc-800 dark:text-zinc-200">{it.product_title}</p>{it.variant && <p className="text-xs text-zinc-400">{it.variant}</p>}</div>
                <span className="text-zinc-400">×{it.quantity}</span>
                <span className="font-semibold">{money(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-base font-bold dark:border-zinc-800"><span>Total paid</span><span>{money(order.total_paid)}</span></div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:text-zinc-950"><Package className="h-4 w-4" /> Track in dashboard</Link>
        <Link to="/products" className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">Continue shopping <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}
