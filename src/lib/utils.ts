export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function money(n: number | string | null | undefined): string {
  const v = Number(n);
  if (!isFinite(v)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(d: string | Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export const CATEGORIES = [
  { slug: 'smartwatch-bands', label: 'Smartwatch Bands' },
  { slug: 'wireless-chargers', label: 'Wireless Chargers' },
  { slug: 'laptop-sleeves', label: 'Laptop Sleeves' },
  { slug: 'phone-cases', label: 'Phone Cases' },
  { slug: 'cable-management', label: 'Cable Management' },
] as const;

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label || slug;
}

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_FLAT = 5.99;
export const TAX_RATE = 0.08;

export interface ComputedTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function computeTotals(subtotal: number): ComputedTotals {
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), shipping, tax, total };
}
