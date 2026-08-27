import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Heart, ShoppingBag, ShieldCheck, Truck, Check, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { money, cn, categoryLabel } from '../lib/utils';
import { useCart } from '../store/cart';
import { useWishlist } from '../store/wishlist';
import { useToast } from '../contexts/ToastContext';
import StarRating from '../components/StarRating';
import Accordion from '../components/Accordion';
import Reviews from '../components/Reviews';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const addItem = useCart((s) => s.addItem);
  const toggle = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => (product ? s.ids.includes(product.id) : false));
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setActiveImg(0);
    setQty(1);
    api.product(Number(id))
      .then((p) => {
        setProduct(p);
        const init: Record<string, string> = {};
        (p.variants || []).forEach((v) => { init[v.name] = v.options[0]; });
        setSelected(init);
        api.products({ category: p.category, limit: 5 }).then((r) => setRelated(r.filter((x) => x.id !== p.id).slice(0, 4))).catch(() => setRelated([]));
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Loading product…" className="min-h-[60vh]" />;
  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white">Back to shop</Link>
      </div>
    );
  }

  const variantString = (product.variants || []).map((v) => selected[v.name] || v.options[0]).join(' / ');
  const outOfStock = product.stock <= 0;
  const images = product.images?.length ? product.images : [{ url: '/images/hero.jpg', alt: product.title }];

  const onAdd = () => {
    if (outOfStock) return;
    addItem({ product_id: product.id, title: product.title, price: product.price, image: images[0].url, quantity: qty, variant: product.variants?.length ? variantString : null, cj_product_id: product.cj_product_id, stock: product.stock });
    toast(`${qty} × ${product.title} added to cart`, { kind: 'success' });
  };

  const onBuyNow = () => {
    onAdd();
    navigate('/checkout');
  };

  const specsContent = (
    <div className="space-y-4">
      {(product.specs || []).map((g) => (
        <div key={g.label}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{g.label}</p>
          <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {g.items.map((it) => (
              <div key={it.k} className="flex justify-between gap-4 border-b border-zinc-100 pb-1.5 text-sm dark:border-zinc-800">
                <dt className="text-zinc-500">{it.k}</dt><dd className="font-medium text-zinc-800 dark:text-zinc-200">{it.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );

  const compatContent = (
    <ul className="space-y-1.5">
      {(product.compatibility || []).map((c) => (
        <li key={c} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"><Check className="h-4 w-4 text-cyan-500" /> {c}</li>
      ))}
    </ul>
  );

  const shippingContent = (
    <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
      <p>Free standard shipping on orders over $50. Orders are fulfilled automatically via CJ Dropshipping and typically arrive in 7–14 business days.</p>
      <p>You'll receive a tracking number once your order ships. 30-day returns accepted on unused items.</p>
    </div>
  );

  const warrantyContent = <p className="text-sm text-zinc-600 dark:text-zinc-300">{product.warranty || '12-month Voltra warranty against manufacturing defects. Contact support for claims.'}</p>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link to="/" className="hover:text-cyan-500">Home</Link><ChevronRight className="h-4 w-4" />
        <Link to={`/products?category=${product.category}`} className="hover:text-cyan-500">{categoryLabel(product.category)}</Link><ChevronRight className="h-4 w-4" />
        <span className="truncate text-zinc-700 dark:text-zinc-300">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <motion.div key={activeImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
            <img src={images[activeImg]?.url} alt={images[activeImg]?.alt || product.title} className="h-full w-full object-cover" />
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={cn('h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition', activeImg === i ? 'border-cyan-500' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{categoryLabel(product.category)}</p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">{product.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={product.rating_avg} size={16} />
            <span className="text-sm text-zinc-500">{product.rating_avg ? product.rating_avg.toFixed(1) : 'New'} · {product.rating_count} reviews</span>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{money(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="mb-1 text-lg text-zinc-400 line-through">{money(product.compare_at_price)}</span>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{product.description}</p>

          {/* stock */}
          <div className="mt-4">
            {outOfStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">Out of stock</span>
            ) : product.stock <= 10 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">Only {product.stock} left in stock</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> In stock — ready to ship</span>
            )}
          </div>

          {/* variants */}
          {product.variants?.length > 0 && (
            <div className="mt-5 space-y-4">
              {product.variants.map((v) => (
                <div key={v.name}>
                  <p className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{v.name}: <span className="text-zinc-500">{selected[v.name] || v.options[0]}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt) => (
                      <button key={opt} onClick={() => setSelected((s) => ({ ...s, [v.name]: opt }))} className={cn('rounded-lg border px-3 py-1.5 text-sm transition', (selected[v.name] || v.options[0]) === opt ? 'border-cyan-500 bg-cyan-500/10 font-semibold text-cyan-600 dark:text-cyan-400' : 'border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300')}>{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* qty + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-cyan-500" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="min-w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="flex h-11 w-11 items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-cyan-500" aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={onAdd} disabled={outOfStock} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-500 dark:text-zinc-950"><ShoppingBag className="h-4 w-4" /> Add to cart</button>
            <button onClick={() => { toggle(product.id); toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { kind: 'info' }); }} className={cn('flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700', wished ? 'text-rose-500' : 'text-zinc-500')} aria-label="Wishlist"><Heart className={cn('h-5 w-5', wished && 'fill-rose-500')} /></button>
          </div>
          <button onClick={onBuyNow} disabled={outOfStock} className="mt-3 w-full rounded-xl border-2 border-cyan-500 py-3 text-sm font-bold text-cyan-600 transition hover:bg-cyan-500 hover:text-white disabled:opacity-50 dark:text-cyan-400">Buy it now</button>

          <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-cyan-500" /> Free shipping over $50</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-cyan-500" /> Verified-delivery reviews</span>
          </div>

          {/* accordions */}
          <div className="mt-6">
            <Accordion items={[{ label: 'Technical Specs', content: specsContent }, { label: 'Compatibility', content: compatContent }, { label: 'Shipping Info', content: shippingContent }, { label: 'Warranty', content: warrantyContent }]} defaultOpen={0} />
          </div>
        </div>
      </div>

      {/* reviews */}
      <div className="mt-12">
        <Reviews productId={product.id} ratingAvg={product.rating_avg} ratingCount={product.rating_count} />
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">You might also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      )}
    </div>
  );
}
