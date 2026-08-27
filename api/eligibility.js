// Review eligibility check for the signed-in user against a product.
import supabase from './db-client.js';
import { preflight } from './lib/cors.js';

const NO = { eligible: false, hasPurchased: false, isDelivered: false, alreadyReviewed: false, signedIn: false };

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { product_id } = req.query;
    if (!product_id) return res.status(400).json({ error: 'product_id required' });

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(200).json(NO);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(200).json(NO);

    const email = (user.email || '').toLowerCase();

    const { data: anyOrders } = await supabase.from('orders').select('id').eq('customer_email', email);
    let hasPurchased = false;
    const anyIds = (anyOrders || []).map((o) => o.id);
    if (anyIds.length) {
      const { data: oi } = await supabase.from('order_items').select('id').in('order_id', anyIds).eq('product_id', product_id).limit(1);
      hasPurchased = !!(oi && oi.length);
    }

    let isDelivered = false;
    const { data: delOrders } = await supabase.from('orders').select('id').eq('customer_email', email).eq('delivery_status', 'delivered');
    const delIds = (delOrders || []).map((o) => o.id);
    if (delIds.length) {
      const { data: oi } = await supabase.from('order_items').select('id').in('order_id', delIds).eq('product_id', product_id).limit(1);
      isDelivered = !!(oi && oi.length);
    }

    const { data: existing } = await supabase.from('reviews').select('id').eq('user_id', user.id).eq('product_id', product_id).limit(1);
    const alreadyReviewed = !!(existing && existing.length);

    return res.status(200).json({
      eligible: isDelivered && !alreadyReviewed,
      hasPurchased,
      isDelivered,
      alreadyReviewed,
      signedIn: true,
    });
  } catch (err) {
    console.error('Eligibility error:', err);
    return res.status(500).json({ error: err.message });
  }
}
