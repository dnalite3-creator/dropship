import supabase from './supabase';
import type { Product, Review, Order } from './types';

const base = '/api';

async function getToken(): Promise<string | null> {
 const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function authHeaders(): Promise<Record<string, string>> {
  const t = await getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function safeErr(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.error || j.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

async function get<T>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(base + path, { headers });
  if (!res.ok) throw new Error(await safeErr(res));
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(base + path, { method: 'POST', headers, body: JSON.stringify(body || {}) });
  if (!res.ok) throw new Error(await safeErr(res));
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(base + path, { method: 'PUT', headers, body: JSON.stringify(body || {}) });
  if (!res.ok) throw new Error(await safeErr(res));
  return res.json() as Promise<T>;
}

async function del<T>(path: string, body: unknown): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(base + path, { method: 'DELETE', headers, body: JSON.stringify(body || {}) });
  if (!res.ok) throw new Error(await safeErr(res));
  return res.json() as Promise<T>;
}

export interface ProductQuery {
  category?: string;
  q?: string;
  sort?: string;
  min?: string;
  max?: string;
  limit?: number;
}

export interface CheckoutResponse {
  ok: boolean;
  simulated: boolean;
  url?: string;
  order_id?: number;
  cj_order_id?: string;
  cj_simulated?: boolean;
  total?: number;
  redirect?: string;
}

export const api = {
  products: (q: ProductQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
    return get<Product[]>(`/products?${params.toString()}`);
  },
  product: (id: number) => get<Product>(`/products?id=${id}`),
  reviews: (productId: number) => get<Review[]>(`/reviews?product_id=${productId}`),
  createReview: (body: { product_id: number; rating: number; comment: string }) =>
    post<Review>(`/reviews`, body),
  orders: () => get<Order[]>(`/orders`),
  checkout: (body: { items: any[]; shipping_address: any; customer_email?: string }) =>
    post<CheckoutResponse>(`/checkout`, body),
  profile: () => post(`/profile`, {}),
  eligibility: (productId: number) =>
    get<{ eligible: boolean; hasPurchased: boolean; isDelivered: boolean; alreadyReviewed: boolean; signedIn: boolean }>(
      `/eligibility?product_id=${productId}`
    ),
  admin: {
    analytics: () => get<any>(`/admin/analytics`),
    reviews: (status = 'all') => get<Review[]>(`/admin/reviews?status=${status}`),
    updateReview: (id: number, status: string) => put<Review>(`/admin/reviews`, { id, status }),
    deleteReview: (id: number) => del<{ ok: boolean }>(`/admin/reviews`, { id }),
    orders: () => get<Order[]>(`/admin/orders`),
    updateOrder: (id: number, delivery_status: string, tracking_number?: string) =>
      put<Order>(`/admin/orders`, { id, delivery_status, tracking_number }),
    products: () => get<Product[]>(`/admin/products`),
    updateProduct: (id: number, updates: { price?: number; stock?: number }) =>
      put<Product>(`/admin/products`, { id, ...updates }),
    sync: () => post<any>(`/admin/sync`, {}),
  },
};
