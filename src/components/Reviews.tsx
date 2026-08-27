import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, MessageSquare, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Review } from '../lib/types';
import StarRating from './StarRating';
import Loader from './Loader';
import { formatDate } from '../lib/utils';

interface Eligibility {
  eligible: boolean;
  hasPurchased: boolean;
  isDelivered: boolean;
  alreadyReviewed: boolean;
  signedIn: boolean;
}

interface Props {
  productId: number;
  ratingAvg: number;
  ratingCount: number;
}

export default function Reviews({ productId, ratingAvg, ratingCount }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, e] = await Promise.all([
        api.reviews(productId),
        user ? api.eligibility(productId) : Promise.resolve(null),
      ]);
      setReviews(r);
      setEligibility(e);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createReview({ product_id: productId, rating, comment });
      toast('Review submitted — pending admin approval', { kind: 'success' });
      setComment('');
      setRating(5);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not submit review', { kind: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
        <MessageSquare className="h-5 w-5 text-cyan-500" /> Verified Reviews
      </h2>

      <div className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center border-b border-zinc-200 pb-4 dark:border-zinc-800 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">{ratingAvg ? ratingAvg.toFixed(1) : '—'}</span>
          <StarRating value={ratingAvg} size={18} className="mt-1" />
          <span className="mt-1 text-xs text-zinc-400">{ratingCount} reviews</span>
        </div>
        <div className="space-y-1.5">
          {breakdown.map((b) => (
            <div key={b.star} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-zinc-500">{b.star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${reviews.length ? (b.count / reviews.length) * 100 : 0}%` }} />
              </div>
              <span className="w-8 text-right text-zinc-400">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {!user ? (
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Lock className="h-5 w-5 text-zinc-400" />
            <span>
              <Link to="/login" className="font-semibold text-cyan-600 hover:underline dark:text-cyan-400">Sign in</Link> to leave a review.
            </span>
          </div>
        ) : eligibility?.alreadyReviewed ? (
          <div className="flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="h-5 w-5" /> Thanks — you've already reviewed this product.
          </div>
        ) : eligibility?.eligible ? (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Write a verified review</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified buyer
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Your rating:</span>
              <StarRating value={rating} size={24} interactive onChange={setRating} />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Share your experience with this accessory…"
              className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:border-cyan-400 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button type="submit" disabled={submitting} className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </form>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
              <Lock className="h-4 w-4 text-zinc-400" /> You must purchase and receive this item to leave a review.
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {eligibility && eligibility.hasPurchased && !eligibility.isDelivered
                ? 'Your order is on the way — reviews unlock once the shipment is marked Delivered.'
                : 'Only customers with a delivered Voltra order can review this product.'}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <Loader label="Loading reviews…" />
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400">No reviews yet. Be the first to share your experience!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    {r.author_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{r.author_name || 'Verified Buyer'}</p>
                    <div className="flex items-center gap-1.5">
                      {r.is_verified_delivery && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                </div>
                <StarRating value={r.rating} size={14} />
              </div>
              {r.comment && <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
