import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Zap, ShoppingBag, Heart, Sun, Moon, Menu, X, Search as SearchIcon, ShieldCheck, LogOut, Package, User } from 'lucide-react';
import { useCart } from '../store/cart';
import { useWishlist } from '../store/wishlist';
import { useUI } from '../store/ui';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';
import SearchBar from './SearchBar';

const NAV = [
  { to: '/products', label: 'Shop' },
  { to: '/products?category=smartwatch-bands', label: 'Bands' },
  { to: '/products?category=wireless-chargers', label: 'Chargers' },
  { to: '/products?category=laptop-sleeves', label: 'Sleeves' },
  { to: '/products?category=phone-cases', label: 'Cases' },
];

export default function Header() {
  const navigate = useNavigate();
  const setCartOpen = useUI((s) => s.setCartOpen);
  const theme = useUI((s) => s.theme);
  const toggleTheme = useUI((s) => s.toggleTheme);
  const cartCount = useCart((s) => s.count());
  const wishlistCount = useWishlist((s) => s.ids.length);
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOverlay, setSearchOverlay] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearchOverlay(true);
      }
      if (e.key === 'Escape') {
        setSearchOverlay(false);
        setMobileOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setAccountOpen(false);
    toast('Signed out', { kind: 'info' });
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Zap className="h-5 w-5 text-white" fill="white" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Voltra</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden max-w-md flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link
            to="/dashboard"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{wishlistCount}</span>
            )}
          </Link>

          <div className="relative">
            <button onClick={() => setAccountOpen((o) => !o)} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800" aria-label="Account">
              <User className="h-5 w-5" />
            </button>
            {accountOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onMouseLeave={() => setAccountOpen(false)}>
                {user ? (
                  <>
                    <div className="truncate px-3 py-2 text-xs text-zinc-400">{user.email}</div>
                    <Link to="/dashboard" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400">
                        <ShieldCheck className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-400">
                    <User className="h-4 w-4" /> Sign in
                  </Link>
                )}
              </div>
            )}
          </div>

          <button onClick={() => setCartOpen(true)} className="relative flex h-10 items-center gap-2 rounded-full bg-zinc-900 px-3.5 font-semibold text-white hover:opacity-90 dark:bg-cyan-500 dark:text-zinc-950" aria-label="Open cart">
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden text-sm sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[11px] font-bold text-zinc-950 ring-2 ring-white dark:bg-zinc-950 dark:text-cyan-400 dark:ring-zinc-950">{cartCount}</span>
            )}
          </button>

          <button onClick={() => setSearchOverlay(true)} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden" aria-label="Search">
            <SearchIcon className="h-5 w-5" />
          </button>
          <button onClick={() => setMobileOpen((o) => !o)} className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden" aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
              {n.label}
            </Link>
          ))}
        </nav>
      )}

      {searchOverlay && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setSearchOverlay(false)}>
          <div className="mx-auto mt-20 max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl bg-white p-3 shadow-2xl dark:bg-zinc-900">
              <SearchBar onPick={() => setSearchOverlay(false)} autoFocus />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
