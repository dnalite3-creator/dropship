// Admin orders: list all orders (with items) and update delivery status.
import supabase from '../db-client.js';
import { preflight } from '../lib/cors.js';
import { requireAdmin } from '../lib/admin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });

    if (req.method === 'GET') {
      const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      let combined = orders || [];
      if (combined.length) {
        const ids = combined.map((o) => o.id);
        const { data: items } = await supabase.from('order_items').select('*').in('order_id', ids);
        const byOrder = {};
        (items || []).forEach((it) => { (byOrder[it.order_id] ||= []).push(it); });
        combined = combined.map((o) => ({ ...o, items: byOrder[o.id] || [] }));
      }
      return res.status(200).json(combined);
    }

    if (req.method === 'PUT') {
      const { id, delivery_status, tracking_number } = req.body || {};
      if (!id || !delivery_status) return res.status(400).json({ error: 'id and delivery_status required.' });
      const valid = ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
      if (!valid.includes(delivery_status)) return res.status(400).json({ error: 'Invalid status.' });
      const update = { delivery_status };
      if (typeof tracking_number !== 'undefined') update.tracking_number = tracking_number || null;
      const { data, error } = await supabase.from('orders').update(update).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin orders error:', err);
    return res.status(500).json({ error: err.message });
  }
}
