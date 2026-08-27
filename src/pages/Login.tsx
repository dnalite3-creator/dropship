import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../lib/googleAuth';
import { useToast } from '../contexts/ToastContext';

type Mode = 'signin' | 'signup';

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/dashboard';
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
      toast(mode === 'signin' ? 'Welcome back!' : 'Account created — check your inbox to confirm.', { kind: 'success' });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600"><Zap className="h-5 w-5 text-white" fill="white" /></span>
            <span className="text-2xl font-extrabold tracking-tight">Voltra</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{mode === 'signin' ? 'Sign in to track orders and leave reviews.' : 'Join Voltra to shop and track your gear.'}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <button onClick={() => signInWithGoogle('Voltra')} className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" /> or <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                <Mail className="h-4 w-4 text-zinc-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full bg-transparent py-2.5 text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Password</label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                <Lock className="h-4 w-4 text-zinc-400" />
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-transparent py-2.5 text-sm outline-none" />
                <button type="button" onClick={() => setShow((s) => !s)} className="text-zinc-400 hover:text-zinc-600">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">{error}</p>}

            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} className="font-semibold text-cyan-600 hover:underline dark:text-cyan-400">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white/50 p-3 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          <p className="font-semibold text-zinc-600 dark:text-zinc-300">Demo accounts</p>
          <p className="mt-1">Admin: <span className="font-mono">timedashy@gmail.com</span> / <span className="font-mono">Voltra2025!</span></p>
          <p>Reviewer: <span className="font-mono">reviewer@voltra.com</span> / <span className="font-mono">Voltra2025!</span></p>
        </div>
      </div>
    </div>
  );
}
