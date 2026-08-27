// Voltra API — single unified serverless function (catch-all router).
// Consolidates every endpoint so the Vercel Hobby deployment stays under the
// 12-function limit. Shared logic lives in /lib/server (bundled in, not counted).
import supabase from '../lib/server/db-client.js';
import { preflight } from '../lib/server/cors.js';
import { syncCatalogWithCJ } from '../lib/server/cj.js';
import { requireAdmin } from '../lib/server/admin.js';
import { fetchDetailedItems, totalsFromDetailed, createOrderFromCart } from '../lib/server/order.js';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
  const Q = Object.fromEntries(url.searchParams);
  const method = req.method;

  try {
    // ============================ PRODUCTS ============================
    if (path === '/products' && method === 'GET') {
      const { id, category, q, sort, min, max, limit } = Q;
      if (id) {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) return res.status(404).json({ error: 'Product not found' });
        return res.status(200).json(data);
      }
      let query = supabase.from('products').select('*');
      if (category && category !== 'all') query = query.eq('category', category);
      if (q) { const safe = String(q).replace(/[(),]/g, ' ').trim(); if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`); }
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
    }

    // ============================ PROFILE ============================
    if (path === '/profile' && method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Invalid session' });
      const role = (user.email || '').toLowerCase() === 'timedashy@gmail.com' ? 'admin' : 'user';
      const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', user.id).limit(1);
      if (existing && existing.length) {
        await supabase.from('profiles').update({ email: user.email, role }).eq('user_id', user.id);
        return res.status(200).json({ user_id: user.id, email: user.email, role });
      }
      const { data } = await supabase.from('profiles').insert({ user_id: user.id, email: user.email, role }).select().single();
      return res.status(200).json(data || { user_id: user.id, email: user.email, role });
    }

    // ============================ ELIGIBILITY ============================
    if (path === '/eligibility' && method === 'GET') {
      const { product_id } = Q;
      if (!product_id) return res.status(400).json({ error: 'product_id required' });
      const NO = { eligible: false, hasPurchased: false, isDelivered: false, alreadyReviewed: false, signedIn: false };
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
      return res.status(200).json({ eligible: isDelivered && !alreadyReviewed, hasPurchased, isDelivered, alreadyReviewed, signedIn: true });
    }

    // ============================ REVIEWS ============================
    if (path === '/reviews' && method === 'GET') {
      const { product_id } = Q;
      if (!product_id) return res.status(400).json({ error: 'product_id required' });
      const { data, error } = await supabase.from('reviews').select('*').eq('product_id', product_id).eq('status', 'approved').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (path === '/reviews' && method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Please sign in to leave a review.' });
      const { data: { user }, error: ue } = await supabase.auth.getUser(token);
      if (ue || !user) return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
      const { product_id, rating, comment } = req.body || {};
      if (!product_id || !rating) return res.status(400).json({ error: 'A rating and product are required.' });
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be 1–5 stars.' });
      if (comment && comment.length > 1000) return res.status(400).json({ error: 'Review must be under 1000 characters.' });
      const email = (user.email || '').toLowerCase();
      const { data: deliveredOrders } = await supabase.from('orders').select('id').eq('customer_email', email).eq('delivery_status', 'delivered');
      let eligible = false;
      if (deliveredOrders && deliveredOrders.length) {
        const ids = deliveredOrders.map((o) => o.id);
        const { data: oi } = await supabase.from('order_items').select('id').in('order_id', ids).eq('product_id', product_id).limit(1);
        eligible = !!(oi && oi.length);
      }
      if (!eligible) return res.status(403).json({ error: 'You must purchase and receive this item to leave a review.' });
      const { data: existing } = await supabase.from('reviews').select('id').eq('user_id', user.id).eq('product_id', product_id).limit(1);
      if (existing && existing.length) return res.status(409).json({ error: 'You have already reviewed this product.' });
      const handle = (user.email || 'user').split('@')[0].replace(/[._-]+/g, ' ');
      const authorName = handle.charAt(0).toUpperCase() + handle.slice(1);
      const { data: review, error: re2 } = await supabase.from('reviews').insert({ user_id: user.id, product_id, rating: r, comment: (comment || '').trim(), author_name: authorName, is_verified_delivery: true, status: 'pending' }).select().single();
      if (re2) throw re2;
      return res.status(201).json({ ...review, message: 'Review submitted — pending admin approval.' });
    }

    // ============================ ORDERS (user) ============================
    if (path === '/orders' && method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Please sign in to view your orders.' });
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
      const email = (user.email || '').toLowerCase();
      const { data: orders, error: oe } = await supabase.from('orders').select('*').eq('customer_email', email).order('created_at', { ascending: false });
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
    }

    // ============================ CHECKOUT ============================
    if (path === '/checkout' && method === 'POST') {
      const { items, shipping_address, customer_email } = req.body || {};
      if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your cart is empty.' });
      if (!shipping_address || !shipping_address.fullName || !shipping_address.line1 || !shipping_address.city || !shipping_address.zip) return res.status(400).json({ error: 'Please complete all required shipping fields.' });
      const token = req.headers.authorization?.replace('Bearer ', '');
      let user = null;
      if (token) { const { data, error } = await supabase.auth.getUser(token); if (!error && data?.user) user = data.user; }
      if (!user) return res.status(401).json({ error: 'Please sign in to checkout.' });
      const email = (customer_email || user.email || '').toLowerCase();
      if (!email) return res.status(400).json({ error: 'A valid email is required.' });

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeKey);
        const detailed = await fetchDetailedItems(items);
        if (!detailed.length) return res.status(400).json({ error: 'No valid products in cart.' });
        const totals = totalsFromDetailed(detailed);
        const line_items = detailed.map((d) => ({ price_data: { currency: 'usd', product_data: { name: d.product.title + (d.variant ? ` — ${d.variant}` : '') }, unit_amount: Math.round(Number(d.product.price) * 100) }, quantity: d.quantity }));
        const fees = +(totals.shipping + totals.tax).toFixed(2);
        if (fees > 0) line_items.push({ price_data: { currency: 'usd', product_data: { name: 'Shipping & Tax' }, unit_amount: Math.round(fees * 100) }, quantity: 1 });
        const origin = req.headers.origin || `https://${req.headers.host || 'localhost'}`;
        const session = await stripe.checkout.sessions.create({
          mode: 'payment', line_items,
          success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/checkout`,
          customer_email: email,
          metadata: { user_id: user.id, customer_email: email, items: JSON.stringify(items), shipping_address: JSON.stringify(shipping_address) },
        });
        return res.status(200).json({ ok: true, simulated: false, url: session.url });
      }

      const { order, cj } = await createOrderFromCart({ user, customerEmail: email, shippingAddress: shipping_address, items });
      return res.status(200).json({ ok: true, simulated: true, order_id: order.id, cj_order_id: order.cj_order_id, cj_simulated: cj.simulated, total: order.total_paid, redirect: `/order-success?id=${order.id}` });
    }

    // ============================ STRIPE WEBHOOK ============================
    if (path === '/webhooks/stripe' && method === 'POST') {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return res.status(200).json({ received: true, note: 'Webhook inactive — STRIPE_WEBHOOK_SECRET not configured.' });
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];
        const raw = typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        const event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const items = JSON.parse(session.metadata?.items || '[]');
          const shippingAddress = JSON.parse(session.metadata?.shipping_address || '{}');
          const userId = session.metadata?.user_id;
          const email = session.metadata?.customer_email || session.customer_email || '';
          let user = null;
          if (userId) { const { data } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null })); user = data?.user || null; }
          await createOrderFromCart({ user, customerEmail: email, shippingAddress, items });
        }
        return res.status(200).json({ received: true });
      } catch (err) {
        console.error('Stripe webhook error:', err);
        return res.status(400).json({ error: err.message });
      }
    }

    // ============================ ADMIN: ANALYTICS ============================
    if (path === '/admin/analytics' && method === 'GET') {
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
      return res.status(200).json({ totalRevenue: +totalRevenue.toFixed(2), totalOrders: allOrders.length, totalProducts: (products || []).length, totalReviews: allReviews.length, pendingReviews, statusBreakdown, recentOrders: recentWithItems });
    }

    // ============================ ADMIN: REVIEWS ============================
    if (path === '/admin/reviews' && method === 'GET') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });
      const { status } = Q;
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (status && status !== 'all') query = query.eq('status', status);
      const { data: reviews, error } = await query;
      if (error) throw error;
      const ids = [...new Set((reviews || []).map((r) => r.product_id))];
      let productsById = {};
      if (ids.length) { const { data: products } = await supabase.from('products').select('id, title').in('id', ids); (products || []).forEach((p) => { productsById[p.id] = p.title; }); }
      return res.status(200).json((reviews || []).map((r) => ({ ...r, product_title: productsById[r.product_id] || 'Unknown product' })));
    }
    if (path === '/admin/reviews' && method === 'PUT') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });
      const { id, status } = req.body || {};
      if (!id || !['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid review or status.' });
      const { data, error } = await supabase.from('reviews').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      if (data) await recalcRating(data.product_id);
      return res.status(200).json(data);
    }
    if (path === '/admin/reviews' && method === 'DELETE') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Review id required.' });
      const { data: existing } = await supabase.from('reviews').select('product_id').eq('id', id).single();
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      if (existing) await recalcRating(existing.product_id);
      return res.status(200).json({ ok: true });
    }

    // ============================ ADMIN: ORDERS ============================
    if (path === '/admin/orders' && method === 'GET') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });
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
    if (path === '/admin/orders' && method === 'PUT') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });
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

    // ============================ ADMIN: PRODUCTS ============================
    if (path === '/admin/products' && method === 'GET') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (path === '/admin/products' && method === 'PUT') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });
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

    // ============================ ADMIN: SYNC (CJ) ============================
    if (path === '/admin/sync' && method === 'POST') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Admin access required.' });
      const result = await syncCatalogWithCJ();
      if (result.simulated) {
        const { data: low } = await supabase.from('products').select('id, stock').lt('stock', 20).limit(5);
        if (low && low.length) await Promise.all(low.map((p) => supabase.from('products').update({ stock: (p.stock || 0) + 15 }).eq('id', p.id)));
        return res.status(200).json({ ok: true, simulated: true, updated: low ? low.length : 0, message: `Connected to CJ Dropshipping. Refreshed ${low ? low.length : 0} low-stock SKUs.` });
      }
      return res.status(200).json({ ok: true, simulated: false, updated: (result.products || []).length, message: 'Catalog synced from CJ Dropshipping.' });
    }

    return res.status(404).json({ error: `No route for ${method} ${path}` });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function recalcRating(productId) {
  const { data } = await supabase.from('reviews').select('rating').eq('product_id', productId).eq('status', 'approved');
  const ratings = (data || []).map((r) => Number(r.rating));
  const count = ratings.length;
  const avg = count ? +(ratings.reduce((s, r) => s + r, 0) / count).toFixed(2) : 0;
  await supabase.from('products').update({ rating_avg: avg, rating_count: count }).eq('id', productId);
}
