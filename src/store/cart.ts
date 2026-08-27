import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: number;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
  variant: string | null;
  cj_product_id: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  lastRemoved: CartItem | null;
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number, variant: string | null) => void;
  updateQty: (product_id: number, variant: string | null, quantity: number) => void;
  undoRemove: () => void;
  clearCart: () => void;
  count: () => number;
}

const matches = (a: { product_id: number; variant: string | null }, pid: number, v: string | null) =>
  a.product_id === pid && (a.variant || null) === (v || null);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastRemoved: null,
      addItem: (item) =>
        set((s) => {
          const idx = s.items.findIndex((i) => matches(i, item.product_id, item.variant));
          if (idx >= 0) {
            const items = [...s.items];
            items[idx] = {
              ...items[idx],
              quantity: Math.min(items[idx].quantity + item.quantity, item.stock || 99),
            };
            return { items, lastRemoved: null };
          }
          return {
            items: [...s.items, { ...item, quantity: Math.min(item.quantity, item.stock || 99) }],
            lastRemoved: null,
          };
        }),
      removeItem: (product_id, variant) =>
        set((s) => {
          const removed = s.items.find((i) => matches(i, product_id, variant)) || null;
          return {
            items: s.items.filter((i) => !matches(i, product_id, variant)),
            lastRemoved: removed,
          };
        }),
      updateQty: (product_id, variant, quantity) =>
        set((s) => ({
          items: s.items.map((i) =>
            matches(i, product_id, variant)
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 99)) }
              : i
          ),
        })),
      undoRemove: () =>
        set((s) => {
          if (!s.lastRemoved) return s;
          return { items: [...s.items, s.lastRemoved], lastRemoved: null };
        }),
      clearCart: () => set({ items: [], lastRemoved: null }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
    }),
    { name: 'voltra-cart' }
  )
);

export const cartSubtotal = (items: CartItem[]): number =>
  +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
