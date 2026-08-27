// Admin products: list all and update price/stock (manage markup margins).
import supabase from '../db-client.js';
import { preflight } from '../lib/cors.js';
import { requireAdmin } from '../lib/admin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'PUT') {
      const { id, price, stock } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Product id required.' });
      const update = {};
      if (typeof price === 'number' && price >= 0) update.price = +price.toFixed(2);
      if (typeof stock === 'number' && stock >= 0) update.stock = Math.floor(stock);
      if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update.' });
      const { data, error } = await supabase.from('products').update(update).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin products error:', err);
    return res.status(500).json({ error: err.message });
  }
}
