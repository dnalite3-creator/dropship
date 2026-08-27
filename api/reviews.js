// Reviews: list approved reviews for a product, or create a review (verified
// purchase + delivered shipment strictly enforced).
import supabase from './db-client.js';
import { preflight } from './lib/cors.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (req.method === 'GET') {
      const { product_id } = req.query;
      if (!product_id) return res.status(400).json({ error: 'product_id required' });
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product_id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Please sign in to leave a review.' });
      const { data: { user }, error: ue } = await supabase.auth.getUser(token);
      if (ue || !user) return res.status(401).json({ error: 'Invalid session. Please sign in again.' });

      const { product_id, rating, comment } = req.body || {};
      if (!product_id || !rating) return res.status(400).json({ error: 'A rating and product are required.' });
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be 1–5 stars.' });
      if (comment && comment.length > 1000) return res.status(400).json({ error: 'Review must be under 1000 characters.' });

      // 1) Verified purchase: does this user have a DELIVERED order containing this product?
      const email = (user.email || '').toLowerCase();
      const { data: deliveredOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', email)
        .eq('delivery_status', 'delivered');
      let eligible = false;
      if (deliveredOrders && deliveredOrders.length) {
        const ids = deliveredOrders.map((o) => o.id);
        const { data: oi } = await supabase
          .from('order_items')
          .select('id')
          .in('order_id', ids)
          .eq('product_id', product_id)
          .limit(1);
        eligible = !!(oi && oi.length);
      }
      if (!eligible) {
        return res.status(403).json({ error: 'You must purchase and receive this item to leave a review.' });
      }

      // 2) Prevent duplicates.
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product_id)
        .limit(1);
      if (existing && existing.length) {
        return res.status(409).json({ error: 'You have already reviewed this product.' });
      }

      const handle = (user.email || 'user').split('@')[0].replace(/[._-]+/g, ' ');
      const authorName = handle.charAt(0).toUpperCase() + handle.slice(1);
      const { data: review, error: re2 } = await supabase.from('reviews').insert({
        user_id: user.id,
        product_id,
        rating: r,
        comment: (comment || '').trim(),
        author_name: authorName,
        is_verified_delivery: true,
        status: 'pending',
      }).select().single();
      if (re2) throw re2;

      return res.status(201).json({ ...review, message: 'Review submitted — pending admin approval.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Reviews API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
