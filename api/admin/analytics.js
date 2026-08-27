// Admin analytics: revenue, order counts, review counts, status breakdown.
import supabase from '../db-client.js';
import { preflight } from '../lib/cors.js';
import { requireAdmin } from '../lib/admin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });

    const [{ data: orders }, { data: products }, { data: reviews }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id'),
      supabase.from('reviews').select('id, status, rating'),
    ]);

    const allOrders = orders || [];
    const paid = allOrders.filter((o) => o.payment_status === 'paid');
    const totalRevenue = paid.reduce((s, o) => s + Number(o.total_paid || 0), 0);

    const statusBreakdown = {};
    allOrders.forEach((o) => { statusBreakdown[o.delivery_status] = (statusBreakdown[o.delivery_status] || 0) + 1; });

    const allReviews = reviews || [];
    const pendingReviews = allReviews.filter((r) => r.status === 'pending').length;

    const recentOrders = allOrders.slice(0, 10);
    let recentWithItems = recentOrders;
    if (recentOrders.length) {
      const ids = recentOrders.map((o) => o.id);
      const { data: items } = await supabase.from('order_items').select('*').in('order_id', ids);
      const byOrder = {};
      (items || []).forEach((it) => { (byOrder[it.order_id] ||= []).push(it); });
      recentWithItems = recentOrders.map((o) => ({ ...o, items: byOrder[o.id] || [] }));
    }

    return res.status(200).json({
      totalRevenue: +totalRevenue.toFixed(2),
      totalOrders: allOrders.length,
      totalProducts: (products || []).length,
      totalReviews: allReviews.length,
      pendingReviews,
      statusBreakdown,
      recentOrders: recentWithItems,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return res.status(500).json({ error: err.message });
  }
}
