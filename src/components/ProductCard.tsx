import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../lib/types';
import { money, cn, categoryLabel } from '../lib/utils';
import { useCart } from '../store/cart';
import { useWishlist } from '../store/wishlist';
import { useToast } from '../contexts/ToastContext';
import StarRating from './StarRating';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const toggle = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const { toast } = useToast();

  const defaultVariant = product.variants?.length
    ? product.variants.map((v) => v.options[0]).join(' / ')
    : null;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock <= 0) return;
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0]?.url || null,
      quantity: 1,
      variant: defaultVariant,
      cj_product_id: product.cj_product_id,
      stock: product.stock,
    });
    toast(`${product.title} added to cart`, { kind: 'success' });
  };

  const outOfStock = product.stock <= 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-cyan-400/50 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-cyan-500/40"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={product.images?.[0]?.url}
          alt={product.images?.[0]?.alt || product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id);
            toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { kind: 'info' });
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110 dark:bg-zinc-900/90"
          aria-label="Toggle wishlist"
        >
          <Heart className={cn('h-4 w-4', wished ? 'fill-rose-500 text-rose-500' : 'text-zinc-500')} />
        </button>
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white">Out of stock</span>
        )}
        {!outOfStock && product.stock <= 10 && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">Only {product.stock} left</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{categoryLabel(product.category)}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-zinc-900 dark:text-zinc-100">{product.title}</h3>
        <div className="mt-1.5">
          <StarRating value={product.rating_avg} size={13} count={product.rating_count} />
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{money(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="ml-1.5 text-sm text-zinc-400 line-through">{money(product.compare_at_price)}</span>
            )}
          </div>
        </div>
        <button
          onClick={onAdd}
          disabled={outOfStock}
          className={cn(
            'mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
            outOfStock
              ? 'cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'
              : 'bg-zinc-900 text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:text-zinc-950 dark:hover:bg-cyan-400'
          )}
        >
          <ShoppingBag className="h-4 w-4" /> {outOfStock ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </Link>
  );
}
