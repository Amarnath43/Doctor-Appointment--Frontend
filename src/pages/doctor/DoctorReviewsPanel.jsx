import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import AxiosInstances from '../../apiManager';
import { Filter, ChevronLeft, ChevronRight, MessageSquare, X, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { makePublicUrlFromKey } from '../../utils/s3PublicUrl';
import { renderStars } from '../../utils/reviewUtils';

/** ----------------------------------
 * Helpers & constants
 * ---------------------------------- */
const PAGE_SIZE = 10;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const safeToFixed1 = (n) => (Number.isFinite(n) ? Number(n).toFixed(1) : '0.0');


const EmptyState = ({ title = 'No data', hint = 'Try changing filters.' }) => (
  <div className="text-center py-14 text-gray-500">
    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
    <div className="text-lg font-semibold">{title}</div>
    <div className="text-sm mt-1">{hint}</div>
  </div>
);

// Normalize rating field (supports rating_overall or rating)
const getRating = (r) => r?.rating_overall ?? r?.rating ?? 0;

/** ----------------------------------
 * Page
 * ---------------------------------- */
const DoctorReviewsPanel = () => {
  // Filters
  const [status, setStatus] = useState('all');
  const [needsReply, setNeedsReply] = useState('all');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [sort, setSort] = useState('newest');

  // Pagination
  const [page, setPage] = useState(1);

  // Data
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [overallRating, setOverallRating] = useState(null);
  const [averageRating, setAverageRating]=useState(0);
  const [ratingCount, setRatingCount]=useState(0)

  // Reply modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const isEditingReply = Boolean(activeReview?.doctor_reply?.repliedAt);
  const replyTextRef = useRef(null);

  // Derived params (stable object)
  const queryParams = useMemo(() => {
    const p = { page, limit: PAGE_SIZE, sort };
    if (status !== 'all') p.status = status;
    if (needsReply !== 'all') p.needsReply = needsReply; // 'true' | 'false'

    let min = minRating ? clamp(Number(minRating), 1, 5) : undefined;
    let max = maxRating ? clamp(Number(maxRating), 1, 5) : undefined;
    if (min && max && min > max) [min, max] = [max, min];
    if (min) p.minRating = min;
    if (max) p.maxRating = max;
    return p;
  }, [page, status, needsReply, minRating, maxRating, sort]);

  // Fetch (with abort + stable reference)
  const fetchData = useCallback(async (signal) => {
    setLoading(true);
    setErr('');
    try {
      const res = await AxiosInstances.get('/doctor/reviews', { params: queryParams, signal });
      const { items = [], total = 0, page: serverPage = 1, limit = PAGE_SIZE, rating_avg, rating_count } = res.data || {};
      setItems(items);
      setTotal(total);
      setPage(serverPage);
      setOverallRating(rating_avg);
      setAverageRating(rating_count);
    } catch (e) {
      if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') setErr('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Debounced filters
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => fetchData(ctrl.signal), 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [fetchData]);

  // Reply modal lifecycle (focus, escape)
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onEsc);
    setTimeout(() => replyTextRef.current?.focus(), 0);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onEsc); };
  }, [modalOpen]);

  const openReplyModal = useCallback((review) => {
    setActiveReview(review);
    setReplyText(review?.doctor_reply?.text || '');
    setModalOpen(true);
  }, []);

  const closeReplyModal = useCallback(() => {
    if (!replySaving) setModalOpen(false);
  }, [replySaving]);

  const saveReply = useCallback(async () => {
    if (!activeReview?._id) return;
    const text = replyText.trim();
    if (!text) return;
    setReplySaving(true);
    try {
      const path = `/reviews/${activeReview._id}/reply`;
      if (isEditingReply) {
        await AxiosInstances.patch(path, { text });
      } else {
        await AxiosInstances.post(path, { text });
      }
      setModalOpen(false);
      await fetchData();
      toast.success('Reply updated successfully');
    } catch (e) {
      toast.error('Failed to save reply.');
    } finally {
      setReplySaving(false);
    }
  }, [activeReview?._id, fetchData, isEditingReply, replyText]);

  // Paging helpers (derive totalPages/hasPrev/hasNext on render)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const goPrev = useCallback(() => { if (hasPrev) setPage((p) => p - 1); }, [hasPrev]);
  const goNext = useCallback(() => { if (hasNext) setPage((p) => p + 1); }, [hasNext]);

  const getDisplayName = (r) => r?.patientId?.name || r?.patient?.name || r?.user?.name || 'Patient';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">My Reviews</h1>
          {
                            
                            
                            typeof overallRating!== 'undefined' && (
                              <div className="flex items-center ">
                                <span className='text-sm text-gray-600'>{overallRating}</span>
                                
                                {renderStars(overallRating)
                                }
                                
                                {typeof averageRating !== 'undefined' && (
                                  <span className="text-gray-600 ml-2">({averageRating} reviews)</span>
                                )}
                              </div>
                            )}
            
          </div>
          <div className="text-base font-medium text-gray-600">
            {loading ? 'Loading reviews...' : `${total} matching reviews`}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-x-6 sm:gap-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <Filter className="w-4 h-4" />
              Filters:
            </div>

            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" title="Status">
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <select value={needsReply} onChange={(e) => setNeedsReply(e.target.value)} className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" title="Needs reply">
              <option value="all">All (replied & not)</option>
              <option value="true">Needs reply</option>
              <option value="false">Has reply</option>
            </select>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input type="number" min={1} max={5} placeholder="Min ★" value={minRating} onChange={(e) => setMinRating(e.target.value)} className="w-full sm:w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="text-gray-400">–</span>
              <input type="number" min={1} max={5} placeholder="Max ★" value={maxRating} onChange={(e) => setMaxRating(e.target.value)} className="w-full sm:w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" title="Sort by">
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
            <div className="p-8 text-center text-red-600 rounded-xl bg-red-50 border border-red-200">{err}</div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <EmptyState title="No reviews found" hint="Try adjusting filters." />
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((r) => (
                <div key={r._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                    <div className="flex items-start gap-4">
                      <img
                        
                        src={makePublicUrlFromKey(r.patientId?.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              r.patientId?.profilePicture || 'Doctor'
                                            )}&background=random`}
                        alt={r.patientId?.name ? `${r.patientId.name}` : 'Patient'}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-blue-200"
                        loading="lazy"
                        decoding="async"
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{r?.patientId?.name || 'Patient'}</div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                          {
                            renderStars(getRating(r))
                          }
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">{dayjs(r.createdAt).format('DD MMM YYYY hh:mm A')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">{r.doctor_reply?.repliedAt ? (
                        <button onClick={() => openReplyModal(r)} className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" title="Edit reply">
                          Edit reply
                        </button>
                      ) : (
                        <button onClick={() => openReplyModal(r)} className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                          Reply
                        </button>
                      )}
                    </div>
                  </div>

                  {r.text && <p className="mt-3 text-gray-800 leading-relaxed">{r.text}</p>}

                  {r.doctor_reply?.text && (
                    <div className="mt-3 rounded-lg border bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Your reply • {dayjs(r.doctor_reply.repliedAt).format('DD MMM YYYY hh:mm A')}</div>
                      <div className="text-sm mt-1">{r.doctor_reply.text}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pager */}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <button onClick={goPrev} disabled={!hasPrev} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors" aria-label="Previous page">
            <ChevronLeft className="w-5 h-5 mx-auto" />
          </button>
          <span className="text-sm font-medium text-gray-700">Page {page} of {totalPages}</span>
          <button onClick={goNext} disabled={!hasNext} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors" aria-label="Next page">
            <ChevronRight className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* Reply Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeReplyModal}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div className="w-full max-w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 mx-2" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reply-modal-title">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 id="reply-modal-title" className="text-xl font-semibold text-gray-900">{isEditingReply ? 'Edit reply' : 'Write a new reply'}</h2>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" onClick={closeReplyModal} aria-label="Close">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {activeReview && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={safeImgUrl(activeReview.patientId?.profilePicture)}
                        alt={activeReview.patientId?.name || 'Patient'}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-200"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{activeReview.patientId?.name || 'Patient'}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-600">
                          <Stars value={getRating(activeReview)} />
                          <span className="text-gray-400">•</span>
                          <span>{dayjs(activeReview.createdAt).format('DD MMM YYYY')}</span>
                        </div>
                      </div>
                    </div>
                    {activeReview.text && <p className="mt-3 text-gray-800 leading-relaxed">"{activeReview.text}"</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Your reply</label>
                  <textarea
                    ref={replyTextRef}
                    rows={5}
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Be professional, courteous, and avoid sharing patient-identifying information."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={800}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={saveReply} disabled={replySaving || !replyText.trim()} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm disabled:opacity-50 inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                    {replySaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditingReply ? (replySaving ? 'Saving…' : 'Save changes') : (replySaving ? 'Posting…' : 'Post reply')}
                  </button>
                  <button onClick={closeReplyModal} disabled={replySaving} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                </div>

                {isEditingReply && activeReview?.doctor_reply?.repliedAt && (
                  <p className="mt-2 text-xs text-gray-500">Edits may only be allowed within 24 hours of your original reply (enforced by server).</p>
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
