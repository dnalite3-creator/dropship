import { Link } from 'react-router-dom';
import { Zap, Twitter, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </span>
            <span className="text-lg font-extrabold">Voltra</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Premium digital & tech accessories, dropshipped to your door with a verified-delivery promise.
          </p>
          <div className="mt-4 flex gap-3 text-zinc-400">
            <a href="#" className="hover:text-cyan-500" aria-label="Twitter"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-cyan-500" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
            <a href="#" className="hover:text-cyan-500" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <li><Link to="/products?category=smartwatch-bands" className="hover:text-cyan-500">Smartwatch Bands</Link></li>
            <li><Link to="/products?category=wireless-chargers" className="hover:text-cyan-500">Wireless Chargers</Link></li>
            <li><Link to="/products?category=laptop-sleeves" className="hover:text-cyan-500">Laptop Sleeves</Link></li>
            <li><Link to="/products?category=phone-cases" className="hover:text-cyan-500">Phone Cases</Link></li>
            <li><Link to="/products?category=cable-management" className="hover:text-cyan-500">Cable Management</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <li><Link to="/dashboard" className="hover:text-cyan-500">Track Order</Link></li>
            <li><a href="#" className="hover:text-cyan-500">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-cyan-500">Warranty</a></li>
            <li><a href="#" className="hover:text-cyan-500">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Stay charged</h4>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Get 10% off your first order and drops on new gear.</p>
          <form onSubmit={(e) => e.preventDefault()} className="mt-3 flex gap-2">
            <input type="email" placeholder="you@email.com" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 dark:border-zinc-700 dark:bg-zinc-900" />
            <button className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:text-zinc-950">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-5 text-center text-xs text-zinc-400 dark:border-zinc-800">
        © {new Date().getFullYear()} Voltra. All rights reserved. Powered by CJ Dropshipping & Stripe.
      </div>
    </footer>
  );
}
