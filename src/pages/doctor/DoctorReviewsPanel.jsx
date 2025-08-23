import React, { useEffect, useMemo, useRef, useState } from 'react';
import AxiosInstances from '../../apiManager';
import {
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast'

/** ------ Helpers ------ */
const PAGE_SIZE = 10;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const Stars = ({ value = 0, size = 'sm' }) => {
  const sizeCls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const val = Number(value) || 0;
  const fullStars = Math.floor(val);
  const percent = (val - fullStars) * 100;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => {
        const isFull = i < fullStars;
        const isFractional = i === fullStars && percent > 0;
        const maskId = `mask-stars-${Math.random().toString(36).substring(2, 9)}`;

        return (
          <svg
            key={i}
            className={`${sizeCls}`}
            viewBox="0 0 24 24"
          >
            {/* The base empty star */}
            <path
              className="text-gray-300"
              fill="currentColor"
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />

            {/* The filled star, clipped by a mask */}
            {isFull || isFractional ? (
              <path
                className="text-yellow-400"
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                style={isFractional ? {
                  mask: `url(#${maskId})`,
                  WebkitMaskImage: `url(#${maskId})`
                } : {}}
              />
            ) : null}

            {/* Mask definition for the fractional fill */}
            {isFractional && (
              <mask id={maskId}>
                <rect x="0" y="0" width={`${percent}%`} height="100%" fill="white" />
              </mask>
            )}
          </svg>
        );
      })}
    </div>
  );
};

const EmptyState = ({ title = 'No data', hint = 'Try changing filters.' }) => (
  <div className="text-center py-14 text-gray-500">
    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
    <div className="text-lg font-semibold">{title}</div>
    <div className="text-sm mt-1">{hint}</div>
  </div>
);

// Normalize rating field (supports rating_overall or rating)
const getRating = (r) => r?.rating_overall ?? r?.rating ?? 0;

// Initials from "First ... Last"
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

// Local initials avatar (no network)
const AvatarInitials = ({ name, className = '' }) => (
  <div
    className={`w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold text-lg ring-2 ring-indigo-200 ${className}`}
    aria-label={`Avatar for ${name || 'Patient'}`}
  >
    {getInitials(name)}
  </div>
);

/** ------ Page ------ */
const DoctorReviewsPanel = () => {
  // Filters
  const [status, setStatus] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
  const [needsReply, setNeedsReply] = useState('all'); // 'all' | 'true' | 'false'
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [sort, setSort] = useState('newest'); // 'newest' | 'oldest' | 'lowest' | 'highest'

  // Paging
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // Data
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [overallRating, setOverallRating] = useState(null);

  // Reply modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const isEditingReply = Boolean(activeReview?.doctor_reply?.repliedAt);
  const replyTextRef = useRef(null);

  // Build query params (normalize min/max)
  const qp = useMemo(() => {
    const p = { page, limit: PAGE_SIZE, sort };
    if (status !== 'all') p.status = status;
    if (needsReply === 'true') p.needsReply = 'true';
    if (needsReply === 'false') p.needsReply = 'false';

    let min = minRating ? clamp(Number(minRating), 1, 5) : undefined;
    let max = maxRating ? clamp(Number(maxRating), 1, 5) : undefined;
    if (min && max && min > max) [min, max] = [max, min];
    if (min) p.minRating = min;
    if (max) p.maxRating = max;

    return p;
  }, [page, status, needsReply, minRating, maxRating, sort]);

  // Fetch
  const fetchData = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await AxiosInstances.get('/doctor/reviews', { params: qp });
      const {
        items = [],
        total = 0,
        page: serverPage = 1,
        limit = PAGE_SIZE,
        overallRating = null, // Assumed to be in the API response
      } = res.data || {};
      setItems(items);
      setTotal(total);
      setPage(serverPage);
      const tp = Math.max(1, Math.ceil(total / limit));
      setTotalPages(tp);
      setHasPrev(serverPage > 1);
      setHasNext(serverPage < tp);
      setOverallRating(overallRating);
    } catch (e) {
      setErr('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Debounce filter changes
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, needsReply, minRating, maxRating, sort]);

  // Fetch on page change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Modal open + lifecycle (body lock, Esc)
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    setTimeout(() => replyTextRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
    };
  }, [modalOpen]);

  const openReplyModal = (review) => {
    setActiveReview(review);
    setReplyText(review?.doctor_reply?.text || '');
    setModalOpen(true);
  };

  const closeReplyModal = () => {
    if (replySaving) return;
    setModalOpen(false);
  };

  const saveReply = async () => {
    if (!activeReview?._id) return;
    if (!replyText.trim()) return;

    setReplySaving(true);
    try {
      if (isEditingReply) {
        await AxiosInstances.patch(`/reviews/${activeReview._id}/reply`, {
          text: replyText.trim(),
        });
      } else {
        await AxiosInstances.post(`/reviews/${activeReview._id}/reply`, {
          text: replyText.trim(),
        });
      }
      setModalOpen(false);
      await fetchData(); // refresh list
      toast.success('Reply updated successfully');
    } catch (e) {
      toast.error('Failed to save reply. (Window may be closed or permission denied)');
    } finally {
      setReplySaving(false);
    }
  };

  // UI helpers
  const goPrev = () => hasPrev && setPage((p) => Math.max(1, p - 1));
  const goNext = () => hasNext && setPage((p) => p + 1);

  // Name getter (uses populated patientId.name; falls back safely)
  const getDisplayName = (r) =>
    r?.patientId?.name || r?.patient?.name || r?.user?.name || 'Patient';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
            {overallRating !== null && (
              <div className="mt-1 flex items-center gap-3 text-gray-600">
                <span className="text-2xl font-semibold text-gray-900">
                  {overallRating.toFixed(1)}
                </span>
                <Stars value={overallRating} size="md" />
              </div>
            )}
          </div>
          <div className="text-base font-medium text-gray-600">
            {loading ? 'Loading reviews...' : `${total} total reviews`}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <Filter className="w-4 h-4" />
              Filters:
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Status"
            >
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={needsReply}
              onChange={(e) => setNeedsReply(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Needs reply"
            >
              <option value="all">All (replied & not)</option>
              <option value="true">Needs reply</option>
              <option value="false">Has reply</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={5}
                placeholder="Min ★"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                min={1}
                max={5}
                placeholder="Max ★"
                value={maxRating}
                onChange={(e) => setMaxRating(e.target.value)}
                className="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Sort by"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest ★</option>
              <option value="lowest">Lowest ★</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-5 h-5 inline-block animate-spin mr-2" />
              Loading reviews…
            </div>
          ) : err ? (
            <div className="p-8 text-center text-red-600 rounded-xl bg-red-50 border border-red-200">
              {err}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <EmptyState title="No reviews found" hint="Try adjusting filters." />
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((r) => (
                <div key={r._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: patient + rating/date */}
                    <div className="flex items-start gap-4">
                      <AvatarInitials name={getDisplayName(r)} />
                      <div>
                        <div className="font-bold text-gray-900 text-lg">
                          {getDisplayName(r)}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                          <Stars value={getRating(r)} />
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">{dayjs(r.createdAt).format('DD MMM YYYY')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: reply CTA */}
                    <div className="flex items-center gap-2">
                      {r.doctor_reply?.repliedAt ? (
                        <button
                          onClick={() => openReplyModal(r)}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          title="Edit reply (within 24h window if enforced)"
                        >
                          Edit reply
                        </button>
                      ) : (
                        <button
                          onClick={() => openReplyModal(r)}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors duration-150"
                        >
                          Reply
                        </button>
                      )}
                  </div>
                </div>

                {/* Review text */}
                {r.text && <p className="mt-3 text-gray-800 leading-relaxed">{r.text}</p>}

                {/* Existing doctor reply */}
                {r.doctor_reply?.text && (
                  <div className="mt-3 rounded-lg border bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      Your reply • {dayjs(r.doctor_reply.repliedAt).format('DD MMM YYYY')}
                    </div>
                    <div className="text-sm mt-1">{r.doctor_reply.text}</div>
                  </div>
                )}
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Pager */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-150"
          >
            <ChevronLeft className="w-5 h-5 mx-auto" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-150"
          >
            <ChevronRight className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* Reply Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeReplyModal}
            aria-hidden="true"
          />
          {/* panel */}
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div
              className="w-full max-w-2xl bg-white rounded-2xl shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reply-modal-title"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 id="reply-modal-title" className="text-xl font-semibold text-gray-900">
                  {isEditingReply ? 'Edit reply' : 'Write a new reply'}
                </h2>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
                  onClick={closeReplyModal}
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Review summary */}
                {activeReview && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Stars value={getRating(activeReview)} />
                      <span className="text-gray-400">•</span>
                      <span>{dayjs(activeReview.createdAt).format('DD MMM YYYY')}</span>
                    </div>
                    {activeReview.text && (
                      <p className="mt-2 text-gray-800 leading-relaxed">"{activeReview.text}"</p>
                    )}
                  </div>
                )}

                {/* Reply textarea */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Your reply</label>
                  <textarea
                    ref={replyTextRef}
                    rows={5}
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-150"
                    placeholder="Be professional, courteous, and avoid sharing patient-identifying information."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={800}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveReply}
                    disabled={replySaving || !replyText.trim()}
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm disabled:opacity-50 inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors duration-150"
                  >
                    {replySaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditingReply ? (replySaving ? 'Saving…' : 'Save changes') : (replySaving ? 'Posting…' : 'Post reply')}
                  </button>
                  <button
                    onClick={closeReplyModal}
                    disabled={replySaving}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                </div>

                {isEditingReply && activeReview?.doctor_reply?.repliedAt && (
                  <p className="mt-2 text-xs text-gray-500">
                    Edits may only be allowed within 24 hours of your original reply (enforced by server).
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReviewsPanel;