// Admin review moderation: list all reviews, approve/reject, or delete.
import supabase from '../db-client.js';
import { preflight } from '../lib/cors.js';
import { requireAdmin } from '../lib/admin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });

    if (req.method === 'GET') {
      const { status } = req.query;
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (status && status !== 'all') query = query.eq('status', status);
      const { data: reviews, error } = await query;
      if (error) throw error;
      const ids = [...new Set((reviews || []).map((r) => r.product_id))];
      let productsById = {};
      if (ids.length) {
        const { data: products } = await supabase.from('products').select('id, title').in('id', ids);
        (products || []).forEach((p) => { productsById[p.id] = p.title; });
      }
      const combined = (reviews || []).map((r) => ({ ...r, product_title: productsById[r.product_id] || 'Unknown product' }));
      return res.status(200).json(combined);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body || {};
      if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid review or status.' });
      }
      const { data, error } = await supabase.from('reviews').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      // Keep the product's aggregate rating in sync when a review is approved/rejected.
      if (data) await recalcRating(data.product_id);
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Review id required.' });
      const { data: existing } = await supabase.from('reviews').select('product_id').eq('id', id).single();
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      if (existing) await recalcRating(existing.product_id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin reviews error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function recalcRating(productId) {
  const { data } = await supabase.from('reviews').select('rating').eq('product_id', productId).eq('status', 'approved');
  const ratings = (data || []).map((r) => Number(r.rating));
  const count = ratings.length;
  const avg = count ? +(ratings.reduce((s, r) => s + r, 0) / count).toFixed(2) : 0;
  await supabase.from('products').update({ rating_avg: avg, rating_count: count }).eq('id', productId);
}
