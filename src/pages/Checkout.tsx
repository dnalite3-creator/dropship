import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CreditCard, Truck, Lock, ArrowRight, ArrowLeft, Loader2, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart, cartSubtotal } from '../store/cart';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import { money, computeTotals, cn, TAX_RATE } from '../lib/utils';
import EmptyState from '../components/EmptyState';

const STEPS = ['Shipping', 'Payment', 'Review'];

export default function Checkout() {
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clearCart);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cartSubtotal(items);
  const totals = computeTotals(subtotal);

  const [form, setForm] = useState({
    fullName: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'United States', phone: '', email: user?.email || '',
    cardName: '', cardNumber: '', exp: '', cvc: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={ShoppingBag} title="Your cart is empty" message="Add some accessories before checking out." action={<Link to="/products" className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white">Shop now</Link>} />
      </div>
    );
  }

  const validateShipping = () => {
    if (!form.fullName.trim()) return 'Please enter your full name.';
    if (!form.line1.trim()) return 'Please enter your street address.';
    if (!form.city.trim()) return 'Please enter your city.';
    if (!form.state.trim()) return 'Please enter your state.';
    if (!form.zip.trim()) return 'Please enter your ZIP / postal code.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email.';
    return '';
  };
  const validatePayment = () => {
    if (!form.cardName.trim()) return 'Please enter the name on the card.';
    if (form.cardNumber.replace(/\s/g, '').length < 15) return 'Please enter a valid card number.';
    if (!/^\d{2}\/\d{2}$/.test(form.exp)) return 'Expiry must be in MM/YY format.';
    if (form.cvc.length < 3) return 'Please enter a valid CVC.';
    return '';
  };

  const next = () => {
    const err = step === 0 ? validateShipping() : step === 1 ? validatePayment() : '';
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(2, s + 1));
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      const shipping_address = { fullName: form.fullName, line1: form.line1, line2: form.line2, city: form.city, state: form.state, zip: form.zip, country: form.country, phone: form.phone };
      const payloadItems = items.map((it) => ({ product_id: it.product_id, quantity: it.quantity, variant: it.variant }));
      const res = await api.checkout({ items: payloadItems, shipping_address, customer_email: form.email });
      if (res.url) { window.location.href = res.url; return; }
      clearCart();
      toast(res.cj_simulated ? 'Order placed — CJ fulfillment simulated' : 'Order placed & sent to CJ Dropshipping!', { kind: 'success' });
      navigate(res.redirect || '/order-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400 dark:border-zinc-700 dark:bg-zinc-950';
  const labelCls = 'mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">Checkout</h1>

      <div className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition', i < step ? 'bg-cyan-500 text-white' : i === step ? 'bg-cyan-500/10 text-cyan-600 ring-2 ring-cyan-500 dark:text-cyan-400' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800')}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>
              <span className={cn('text-sm font-medium', i === step ? 'text-zinc-900 dark:text-white' : 'text-zinc-400')}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn('mx-3 h-0.5 flex-1 rounded-full', i < step ? 'bg-cyan-500' : 'bg-zinc-200 dark:bg-zinc-800')} />}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              {step === 0 && (
                <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white"><Truck className="h-5 w-5 text-cyan-500" /> Shipping details</h2>
                  <div><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="you@email.com" /></div>
                  <div><label className={labelCls}>Full name</label><input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls} placeholder="Alex Morgan" /></div>
                  <div><label className={labelCls}>Address</label><input value={form.line1} onChange={(e) => set('line1', e.target.value)} className={inputCls} placeholder="123 Market St" /></div>
                  <div><label className={labelCls}>Apartment, suite, etc. (optional)</label><input value={form.line2} onChange={(e) => set('line2', e.target.value)} className={inputCls} /></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>City</label><input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} /></div><div><label className={labelCls}>State</label><input value={form.state} onChange={(e) => set('state', e.target.value)} className={inputCls} /></div></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>ZIP</label><input value={form.zip} onChange={(e) => set('zip', e.target.value)} className={inputCls} /></div><div><label className={labelCls}>Country</label><input value={form.country} onChange={(e) => set('country', e.target.value)} className={inputCls} /></div></div>
                  <div><label className={labelCls}>Phone (optional)</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} /></div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white"><CreditCard className="h-5 w-5 text-cyan-500" /> Payment details</h2>
                  <div className="flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2.5 text-xs text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300"><Lock className="h-4 w-4" /> Demo mode — no real charge. Add a Stripe key to go live.</div>
                  <div><label className={labelCls}>Name on card</label><input value={form.cardName} onChange={(e) => set('cardName', e.target.value)} className={inputCls} placeholder="Alex Morgan" /></div>
                  <div><label className={labelCls}>Card number</label><input value={form.cardNumber} onChange={(e) => set('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())} className={inputCls} placeholder="4242 4242 4242 4242" inputMode="numeric" /></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Expiry (MM/YY)</label><input value={form.exp} onChange={(e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2); set('exp', v); }} className={inputCls} placeholder="12/27" /></div><div><label className={labelCls}>CVC</label><input value={form.cvc} onChange={(e) => set('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))} className={inputCls} placeholder="123" inputMode="numeric" /></div></div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white"><ShieldCheck className="h-5 w-5 text-cyan-500" /> Review &amp; confirm</h2>
                  <div><p className="mb-1 text-xs font-medium text-zinc-500">Shipping to</p><p className="text-sm text-zinc-800 dark:text-zinc-200">{form.fullName}<br />{form.line1}{form.line2 ? `, ${form.line2}` : ''}<br />{form.city}, {form.state} {form.zip}<br />{form.country}</p></div>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                  <div><p className="mb-2 text-xs font-medium text-zinc-500">Payment</p><p className="text-sm text-zinc-800 dark:text-zinc-200">•••• •••• •••• {form.cardNumber.replace(/\s/g, '').slice(-4)} · {form.exp}</p></div>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                  <div className="space-y-2">{items.map((it) => (<div key={`${it.product_id}-${it.variant}`} className="flex items-center gap-3 text-sm"><img src={it.image || ''} alt="" className="h-10 w-10 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-medium text-zinc-800 dark:text-zinc-200">{it.title}</p>{it.variant && <p className="text-xs text-zinc-400">{it.variant}</p>}</div><span className="text-zinc-500">×{it.quantity}</span><span className="font-semibold">{money(it.price * it.quantity)}</span></div>))}</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">{error}</p>}

          <div className="mt-5 flex items-center justify-between">
            {step > 0 ? <button onClick={() => { setError(''); setStep((s) => s - 1); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</button> : <Link to="/products" className="text-sm font-semibold text-zinc-500 hover:text-cyan-500">Continue shopping</Link>}
            {step < 2 ? <button onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-400">Continue <ArrowRight className="h-4 w-4" /></button> : <button onClick={placeOrder} disabled={placing} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:opacity-60 dark:bg-cyan-500 dark:text-zinc-950">{placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Place order · {money(totals.total)}</button>}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Order summary</h2>
            <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
              {items.map((it) => (<div key={`${it.product_id}-${it.variant}`} className="flex gap-3"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">{it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}<span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white dark:bg-cyan-500 dark:text-zinc-950">{it.quantity}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{it.title}</p>{it.variant && <p className="truncate text-xs text-zinc-400">{it.variant}</p>}</div><span className="text-sm font-semibold">{money(it.price * it.quantity)}</span></div>))}
            </div>
            <div className="space-y-1.5 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
              <Row label="Subtotal" value={money(totals.subtotal)} />
              <Row label="Shipping" value={totals.shipping === 0 ? 'Free' : money(totals.shipping)} />
              <Row label={`Tax (${Math.round(TAX_RATE * 100)}%)`} value={money(totals.tax)} />
              <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-base font-bold text-zinc-900 dark:border-zinc-800 dark:text-white"><span>Total</span><span>{money(totals.total)}</span></div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800/50"><Lock className="h-3.5 w-3.5" /> Encrypted, secure checkout</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300"><span>{label}</span><span className="font-medium text-zinc-800 dark:text-zinc-100">{value}</span></div>;
}
