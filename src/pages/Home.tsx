import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Lock, Zap, Watch, BatteryCharging, Laptop, Smartphone, Cable, Star } from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';
import { CATEGORIES, categoryLabel, money } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const CATEGORY_ICONS: Record<string, any> = {
  'smartwatch-bands': Watch,
  'wireless-chargers': BatteryCharging,
  'laptop-sleeves': Laptop,
  'phone-cases': Smartphone,
  'cable-management': Cable,
};

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products({ limit: 8, sort: 'newest' })
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-zinc-950 dark:border-zinc-800">
        <div className="absolute inset-0">
          <img src="/images/hero.jpg" alt="Voltra tech accessories" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 md:py-36">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Zap className="h-3.5 w-3.5" /> Digital & Tech Accessories, dropshipped fast
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Power up your <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">everyday tech</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-xl text-lg text-zinc-300">
            Smartwatch bands, wireless chargers, laptop sleeves & more — curated accessories sourced via CJ Dropshipping and delivered to your door.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap items-center gap-3">
            <Link to="/products" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-cyan-400">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/products?category=wireless-chargers" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
              Explore accessories
            </Link>
          </motion.div>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-cyan-400" /> Verified-delivery reviews</span>
            <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-cyan-400" /> Free shipping over $50</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-cyan-400" /> Secure Stripe checkout</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Shop by category</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Find the right gear for your devices.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug] || Zap;
            return (
              <Link key={c.slug} to={`/products?category=${c.slug}`} className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-cyan-400/50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-500 transition group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-center text-sm font-semibold text-zinc-900 dark:text-white">{c.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">New arrivals</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Fresh accessories, just landed.</p>
          </div>
          <Link to="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-600 hover:underline dark:text-cyan-400">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {loading ? (
          <Loader label="Loading products…" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Value props */}
      <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: 'Fast dropshipping', text: 'CJ fulfillment auto-dispatches every order.' },
            { icon: ShieldCheck, title: 'Verified reviews', text: 'Only delivered buyers can review products.' },
            { icon: RotateCcw, title: '30-day returns', text: 'Not the right fit? Send it back, hassle-free.' },
            { icon: Lock, title: 'Secure payments', text: 'Stripe-encrypted checkout on every order.' },
          ].map((v) => (
            <div key={v.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500"><v.icon className="h-5 w-5" /></span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{v.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
