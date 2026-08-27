// Shared order creation + CJ fulfillment logic (used by checkout & webhook).
import supabase from '../../api/db-client.js';
import { fulfillOrderWithCJ } from './cj.js';

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_FLAT = 5.99;
export const TAX_RATE = 0.08;

export async function fetchDetailedItems(items) {
  const detailed = [];
  for (const it of (items || [])) {
    const { data: product, error } = await supabase.from('products').select('id, title, price, images, stock, cj_product_id').eq('id', it.product_id).single();
    if (error || !product) continue;
    detailed.push({ ...it, product });
  }
  return detailed;
}

export function totalsFromDetailed(detailed) {
  const subtotal = +detailed.reduce((s, d) => s + Number(d.product.price) * d.quantity, 0).toFixed(2);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);
  return { subtotal, shipping, tax, total };
}

export async function createOrderFromCart({ user, customerEmail, shippingAddress, items }) {
  const detailed = await fetchDetailedItems(items);
  if (!detailed.length) throw new Error('No valid products in cart.');
  const totals = totalsFromDetailed(detailed);

  const { data: order, error: oe } = await supabase.from('orders').insert({
    user_id: user?.id || null,
    customer_email: (customerEmail || '').toLowerCase(),
    shipping_address: shippingAddress,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    tax: totals.tax,
    total_paid: totals.total,
    payment_status: 'paid',
    delivery_status: 'processing',
  }).select().single();
  if (oe) throw oe;

  const itemRows = [];
  const cjItems = [];
  for (const d of detailed) {
    itemRows.push({ order_id: order.id, product_id: d.product.id, product_title: d.product.title, quantity: d.quantity, price: d.product.price, variant: d.variant || null, image: d.product.images?.[0]?.url || null });
    cjItems.push({ cjProductId: d.product.cj_product_id, quantity: d.quantity, variant: d.variant });
    const newStock = Math.max(0, (d.product.stock || 0) - d.quantity);
    await supabase.from('products').update({ stock: newStock }).eq('id', d.product.id);
  }
  if (itemRows.length) {
    const { error: ie } = await supabase.from('order_items').insert(itemRows);
    if (ie) console.error('order_items insert error:', ie);
  }

  const cj = await fulfillOrderWithCJ({ orderId: order.id, customerEmail, shippingAddress, items: cjItems });
  const update = {};
  if (cj.cj_order_id) update.cj_order_id = cj.cj_order_id;
  if (cj.tracking_number) update.tracking_number = cj.tracking_number;
  if (Object.keys(update).length) await supabase.from('orders').update(update).eq('id', order.id);

  return { order: { ...order, ...update }, cj, totals, items: itemRows };
}
