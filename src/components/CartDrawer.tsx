import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, cartSubtotal } from '../store/cart';
import { useUI } from '../store/ui';
import { useToast } from '../contexts/ToastContext';
import { money } from '../lib/utils';
import QuantityStepper from './QuantityStepper';
import ShippingProgress from './ShippingProgress';
import EmptyState from './EmptyState';

export default function CartDrawer() {
  const open = useUI((s) => s.cartOpen);
  const setOpen = useUI((s) => s.setCartOpen);
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);
  const undoRemove = useCart((s) => s.undoRemove);
  const clearCart = useCart((s) => s.clearCart);
  const { toast } = useToast();
  const navigate = useNavigate();
  const subtotal = cartSubtotal(items);

  const handleRemove = (product_id: number, variant: string | null, title: string) => {
    removeItem(product_id, variant);
    toast(`${title} removed`, {
      kind: 'info',
      undo: () => {
        undoRemove();
        toast('Item restored', { kind: 'success' });
      },
    });
  };

  const goCheckout = () => {
    setOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <ShoppingBag className="h-5 w-5 text-cyan-500" /> Your Cart ({items.length})
              </h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 overflow-y-auto">
                <EmptyState
                  icon={ShoppingBag}
                  title="Your cart is empty"
                  message="Browse our accessories and add your favorites."
                  action={
                    <button onClick={() => { setOpen(false); navigate('/products'); }} className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400">
                      Shop now
                    </button>
                  }
                />
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {items.map((it) => (
                    <div key={`${it.product_id}-${it.variant}`} className="flex gap-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                        {it.image && <img src={it.image} alt={it.title} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{it.title}</p>
                            {it.variant && <p className="text-xs text-zinc-400">{it.variant}</p>}
                          </div>
                          <button onClick={() => handleRemove(it.product_id, it.variant, it.title)} className="text-zinc-400 hover:text-rose-500" aria-label="Remove item">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <QuantityStepper value={it.quantity} onChange={(v) => updateQty(it.product_id, it.variant, v)} max={it.stock || 99} size="sm" />
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">{money(it.price * it.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={clearCart} className="text-xs text-zinc-400 hover:text-rose-500">Clear cart</button>
                </div>
                <div className="space-y-3 border-t border-zinc-200 p-5 dark:border-zinc-800">
                  <ShippingProgress subtotal={subtotal} />
                  <div className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-white">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <button onClick={goCheckout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90 dark:bg-cyan-500 dark:text-zinc-950">
                    Checkout <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-center text-xs text-zinc-400">Taxes & shipping calculated at checkout</p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
