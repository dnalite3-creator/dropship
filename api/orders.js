// List the signed-in user's orders with their line items.
import supabase from './db-client.js';
import { preflight } from './lib/cors.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Please sign in to view your orders.' });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid session. Please sign in again.' });

    const email = (user.email || '').toLowerCase();
    const { data: orders, error: oe } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });
    if (oe) throw oe;

    let combined = orders || [];
    if (combined.length) {
      const ids = combined.map((o) => o.id);
      const { data: items } = await supabase.from('order_items').select('*').in('order_id', ids);
      const byOrder = {};
      (items || []).forEach((it) => { (byOrder[it.order_id] ||= []).push(it); });
      combined = combined.map((o) => ({ ...o, items: byOrder[o.id] || [] }));
    }
    return res.status(200).json(combined);
  } catch (err) {
    console.error('Orders API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
