// Create a checkout. Uses Stripe when STRIPE_SECRET_KEY is configured, otherwise
// runs a fully-functional simulated checkout that creates the order, decrements
// stock, and submits to CJ Dropshipping (also simulated without a CJ key).
import supabase from './db-client.js';
import { preflight } from './lib/cors.js';
import { createOrderFromCart, fetchDetailedItems, totalsFromDetailed } from './lib/order.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { items, shipping_address, customer_email } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your cart is empty.' });
    if (!shipping_address || !shipping_address.fullName || !shipping_address.line1 || !shipping_address.city || !shipping_address.zip) {
      return res.status(400).json({ error: 'Please complete all required shipping fields.' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    let user = null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) user = data.user;
    }
    if (!user) return res.status(401).json({ error: 'Please sign in to checkout.' });

    const email = (customer_email || user.email || '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'A valid email is required.' });

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // ---- Real Stripe path ----
    if (stripeKey) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey);
      const detailed = await fetchDetailedItems(items);
      if (!detailed.length) return res.status(400).json({ error: 'No valid products in cart.' });
      const totals = totalsFromDetailed(detailed);
      const line_items = detailed.map((d) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: d.product.title + (d.variant ? ` — ${d.variant}` : '') },
          unit_amount: Math.round(Number(d.product.price) * 100),
        },
        quantity: d.quantity,
      }));
      const fees = +(totals.shipping + totals.tax).toFixed(2);
      if (fees > 0) {
        line_items.push({
          price_data: { currency: 'usd', product_data: { name: 'Shipping & Tax' }, unit_amount: Math.round(fees * 100) },
          quantity: 1,
        });
      }
      const origin = req.headers.origin || `https://${req.headers.host || 'localhost'}`;
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items,
        success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout`,
        customer_email: email,
        metadata: {
          user_id: user.id,
          customer_email: email,
          items: JSON.stringify(items),
          shipping_address: JSON.stringify(shipping_address),
        },
      });
      return res.status(200).json({ ok: true, simulated: false, url: session.url });
    }

    // ---- Simulated path (no Stripe key) ----
    const { order, cj, totals } = await createOrderFromCart({
      user,
      customerEmail: email,
      shippingAddress: shipping_address,
      items,
    });

    return res.status(200).json({
      ok: true,
      simulated: true,
      order_id: order.id,
      cj_order_id: order.cj_order_id,
      cj_simulated: cj.simulated,
      total: totals.total,
      redirect: `/order-success?id=${order.id}`,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message || 'Checkout failed. Please try again.' });
  }
}
