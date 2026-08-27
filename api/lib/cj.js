// CJ Dropshipping integration helper.
// Uses process.env.CJ_DROPSHIPPING_API_KEY. When no key is configured the
// helper runs in SIMULATED mode so the entire app stays functional end-to-end.

const CJ_BASE = 'https://developers.cjdropshipping.com';

// Submit an order to CJ for automated fulfillment & dispatch.
export async function fulfillOrderWithCJ({ orderId, customerEmail, shippingAddress, items }) {
  const apiKey = process.env.CJ_DROPSHIPPING_API_KEY;
  const payload = {
    vid: String(orderId),
    customer_email: customerEmail,
    shipping_address: shippingAddress,
    items: (items || []).map((i) => ({ vid: i.cjProductId, quantity: i.quantity, variant: i.variant || '' })),
  };

  if (!apiKey) {
    // Simulated CJ fulfillment — returns a plausible CJ order reference.
    const cjOrderId = 'CJ' + Date.now().toString(36).toUpperCase();
    return {
      ok: true,
      simulated: true,
      cj_order_id: cjOrderId,
      tracking_number: null,
      message: 'Simulated CJ fulfillment (no CJ_DROPSHIPPING_API_KEY configured).',
    };
  }

  try {
    const res = await fetch(`${CJ_BASE}/api/v1.0/order/createOrder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', AccessToken: apiKey },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data?.code !== 200) throw new Error(data?.message || 'CJ order creation failed');
    return {
      ok: true,
      simulated: false,
      cj_order_id: data?.data?.orderId || data?.data?.cjOrderId || null,
      tracking_number: data?.data?.trackingNumber || null,
    };
  } catch (err) {
    return { ok: false, simulated: false, error: err.message };
  }
}

// Query a shipment's status from CJ (used by the verified-delivery review check).
export async function trackShipmentWithCJ(cjOrderId) {
  const apiKey = process.env.CJ_DROPSHIPPING_API_KEY;
  if (!apiKey) {
    return { ok: true, simulated: true, status: 'simulated', tracking_number: null };
  }
  try {
    const res = await fetch(`${CJ_BASE}/api/v1.0/shipping/query?order_id=${encodeURIComponent(cjOrderId)}`, {
      headers: { AccessToken: apiKey },
    });
    const data = await res.json();
    return {
      ok: true,
      simulated: false,
      status: data?.data?.status || 'processing',
      tracking_number: data?.data?.trackingNumber || null,
    };
  } catch (err) {
    return { ok: false, simulated: true, error: err.message };
  }
}

// Pull the product catalog from CJ to sync Voltra's catalog.
export async function syncCatalogWithCJ() {
  const apiKey = process.env.CJ_DROPSHIPPING_API_KEY;
  if (!apiKey) {
    return { ok: true, simulated: true, updated: 0, message: 'Simulated catalog sync (no API key). Catalog unchanged.' };
  }
  try {
    const res = await fetch(`${CJ_BASE}/api/v1.0/product/listProducts?pageNo=1&pageSize=100`, {
      headers: { AccessToken: apiKey },
    });
    const data = await res.json();
    return { ok: true, simulated: false, products: data?.data?.list || [] };
  } catch (err) {
    return { ok: false, simulated: true, error: err.message };
  }
}
