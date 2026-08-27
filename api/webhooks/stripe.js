// Stripe webhook listener. On checkout.session.completed, writes the order +
// order_items to Supabase and submits the order to CJ Dropshipping.
// Requires STRIPE_WEBHOOK_SECRET (and STRIPE_SECRET_KEY) configured via Secrets.
import supabase from '../db-client.js';
import { preflight } from '../lib/cors.js';
import { createOrderFromCart } from '../lib/order.js';

// Vercel: keep the raw body so Stripe signature verification works.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(200).json({ received: true, note: 'Webhook inactive — STRIPE_WEBHOOK_SECRET not configured.' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const rawBody = typeof req.body === 'string' ? Buffer.from(req.body) : req.body;
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const items = JSON.parse(session.metadata?.items || '[]');
      const shippingAddress = JSON.parse(session.metadata?.shipping_address || '{}');
      const userId = session.metadata?.user_id;
      const email = session.metadata?.customer_email || session.customer_email || '';

      let user = null;
      if (userId) {
        const { data } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }));
        user = data?.user || null;
      }
      await createOrderFromCart({ user, customerEmail: email, shippingAddress: shippingAddress, items });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return res.status(400).json({ error: err.message });
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
}
