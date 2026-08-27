// Product catalog: list with filters, or fetch a single product by id.
import supabase from './db-client.js';
import { preflight } from './lib/cors.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { id, category, q, sort, min, max, limit } = req.query;

    if (id) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) return res.status(404).json({ error: 'Product not found' });
      return res.status(200).json(data);
    }

    let query = supabase.from('products').select('*');
    if (category && category !== 'all') query = query.eq('category', category);
    if (q) {
      const safe = String(q).replace(/[(),]/g, ' ').trim();
      if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
    if (min) query = query.gte('price', Number(min));
    if (max) query = query.lte('price', Number(max));

    if (sort === 'price-asc') query = query.order('price', { ascending: true });
    else if (sort === 'price-desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating_avg', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    query = query.limit(Number(limit) || 100);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('Products API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
