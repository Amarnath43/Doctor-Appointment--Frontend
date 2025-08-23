import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AxiosInstances from '../../apiManager';
import toast from 'react-hot-toast';
import { Search, Trash2, Loader2, RefreshCw, CheckCircle, MoreHorizontal, MessageSquare, AlertTriangle, Filter, X } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal'; 
import { makePublicUrlFromKey } from '../../utils/s3PublicUrl';

/* ----------------------------- helpers ----------------------------- */

const PAGE_SIZE = 30;

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return '—'; }
}

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

// ✅ FIXED StarsPrecise component
function StarsPrecise({ value, size = 16 }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / 5) * 100));
  const sizeCls = size <= 16 ? 'w-4 h-4' : size <= 20 ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <div className="relative inline-block align-middle" role="img" aria-label={`${value} out of 5`}>
      {/* Background (gray) stars */}
      <div className="flex gap-0.5 text-gray-300">
        {[...Array(5)].map((_, i) => (
          <svg key={`e${i}`} viewBox="0 0 24 24" className={sizeCls}>
            <path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        ))}
      </div>
      {/* Foreground (yellow) stars, clipped by a parent div */}
      <div className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none" style={{ width: `${pct}%` }}>
        <div className="flex gap-0.5 text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <svg key={`f${i}`} viewBox="0 0 24 24" className={classNames(sizeCls, 'flex-shrink-0')}>
              <path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}


const statusPill = (s) => ({
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-rose-100 text-rose-800',
}[s] || 'bg-gray-100 text-gray-800');

/* --------------------------- API functions -------------------------- */

async function fetchReviewsPage({ pageParam = 1, filters }) {
  const params = { ...filters, page: pageParam, limit: PAGE_SIZE };
  const { data } = await AxiosInstances.get('/admin/reviews', { params });
  return data;
}

async function fetchStats(filters) {
  const { data } = await AxiosInstances.get('/admin/reviews/stats', { params: { ...filters } });
  return data;
}

async function patchStatus({ id, status }) {
  const { data } = await AxiosInstances.patch(`/admin/reviews/${id}/status`, { status });
  return data;
}

async function deleteReview(id) {
  const { data } = await AxiosInstances.delete(`/admin/reviews/${id}`);
  return data;
}

/* ---------------------------- main component ---------------------------- */

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const sentinelRef = useRef(null);

  // form state
  const [qDoctor, setQDoctor] = useState('');
  const [qPatient, setQPatient] = useState('');
  const [qHospital, setQHospital] = useState('');
  const [statusSet, setStatusSet] = useState(new Set());
  const [ratingMin, setRatingMin] = useState('');
  const [ratingMax, setRatingMax] = useState('');
  const [hasReply, setHasReply] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // committed filters
  const [filters, setFilters] = useState({});
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const stableFilters = useMemo(() => ({ ...filters }), [filters]);

  // queries
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['adminReviews', stableFilters],
    queryFn: ({ pageParam = 1 }) => fetchReviewsPage({ pageParam, filters: stableFilters }),
    getNextPageParam: (last) => last?.hasNextPage ? last.nextPage : undefined,
    keepPreviousData: false
  });

  const pages = data?.pages || [];
  const items = pages.flatMap(p => p.items || []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminReviews:stats', stableFilters],
    queryFn: () => fetchStats(stableFilters)
  });

  // infinite scroll observer
  useEffect(() => {
    if (!hasNextPage || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: '400px' } // Observe against the viewport
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // mutations
  const statusMut = useMutation({
    mutationFn: patchStatus,
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['adminReviews'] });
      qc.invalidateQueries({ queryKey: ['adminReviews:stats'] });
    },
    onError: () => toast.error('Failed to update status')
  });

  const deleteMut = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      toast.success('Review deleted');
      qc.invalidateQueries({ queryKey: ['adminReviews'] });
      qc.invalidateQueries({ queryKey: ['adminReviews:stats'] });
    },
    onError: () => toast.error('Failed to delete review')
  });

  // actions
  const onApply = () => {
    const s = Array.from(statusSet);
    const next = {
      qDoctor: qDoctor.trim() || undefined,
      qPatient: qPatient.trim() || undefined,
      qHospital: qHospital.trim() || undefined,
      status: s.length ? s.join(',') : undefined,
      ratingMin: ratingMin || undefined,
      ratingMax: ratingMax || undefined,
      hasReply: hasReply || undefined,
      from: from || undefined,
      to: to || undefined
    };
    setFilters(next);
    setIsFilterOpen(false);
  };

  const onClear = () => {
    setQDoctor(''); setQPatient(''); setQHospital('');
    setStatusSet(new Set());
    setRatingMin(''); setRatingMax('');
    setHasReply('');
    setFrom(''); setTo('');
    setFilters({});
  };

  const executeDelete = () => {
    if (deletingReviewId) {
      deleteMut.mutate(deletingReviewId);
    }
    setDeletingReviewId(null);
  };

  /* ------------------------------ UI bits ------------------------------ */

  const StatusCheckbox = ({ value, label }) => {
    const checked = statusSet.has(value);
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={checked}
          onChange={() => {
            const next = new Set(statusSet);
            checked ? next.delete(value) : next.add(value);
            setStatusSet(next);
          }}
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
    );
  };

  const Row = ({ r }) => {
    const avatar = r?.patientId?.profilePicture || '/default-avatar.png';
    const patientName = r?.patientId?.name || 'Anonymous';
    const doctorName = r?.doctorId?.userId?.name || '—';
    const hospitalName = r?.hospitalId?.name || '—';
    const hasReplyBool = !!(r?.doctor_reply?.text);
    const isDeleting = deleteMut.isLoading && deleteMut.variables === r._id;
    const isUpdatingStatus = statusMut.isLoading && statusMut.variables?.id === r._id;
  
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-center gap-4 min-w-0">
            <img src={makePublicUrlFromKey(avatar)} alt={patientName} className="w-12 h-12 rounded-full object-cover"/>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">{patientName}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <StarsPrecise value={r.rating_overall} />
                <span className="text-sm font-bold text-gray-600">{Number(r.rating_overall).toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
             <span className={classNames('px-2.5 py-1 rounded-md text-xs font-semibold', statusPill(r.status))}>
                {r.status}
              </span>
            <p className="text-xs text-gray-500 mt-1">{fmtDate(r.createdAt)}</p>
          </div>
        </div>
  
        {/* Body */}
        <div className="p-4 pt-0 flex-grow border-t border-gray-100">
            <div className="space-y-1 text-sm text-gray-600 my-3">
                <p><span className="font-medium text-gray-500">Doctor:</span> {doctorName}</p>
                <p><span className="font-medium text-gray-500">Hospital:</span> {hospitalName}</p>
            </div>
            <div className="border-t border-gray-200 pt-3">
              {r.text && <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{r.text}</p>}
    
              {hasReplyBool && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Doctor's Reply</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.doctor_reply.text}</p>
                  </div>
              )}
            </div>
        </div>
        
        {/* Footer with Actions */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
            {(isUpdatingStatus || isDeleting) && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
            <select
              className="text-sm border rounded-md bg-white text-gray-700 px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70"
              value=""
              disabled={isUpdatingStatus || isDeleting}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                statusMut.mutate({ id: r._id, status: val });
              }}
            >
              <option value="">Change Status…</option>
              <option value="approved">Approve</option>
              <option value="pending">Set Pending</option>
              <option value="rejected">Reject</option>
            </select>
            <button
              onClick={() => setDeletingReviewId(r._id)}
              className="p-2 rounded-md hover:bg-rose-100 text-rose-600 transition-colors disabled:opacity-70"
              title="Delete review"
              disabled={isUpdatingStatus || isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen py-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          {/* header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Reviews (Admin)</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Filter className="w-4 h-4" /> Filters
              </button>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className={classNames("w-4 h-4", isLoading && "animate-spin")} /> Refresh
              </button>
            </div>
          </div>

          {/* filters */}
          <div className={classNames(
            "fixed inset-0 z-50 bg-white p-6 transition-transform transform lg:relative lg:inset-auto lg:z-auto lg:p-6 lg:rounded-2xl lg:border lg:border-gray-200 lg:shadow-sm lg:block",
            isFilterOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}>
            <div className="flex items-center justify-between lg:hidden mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* name searches */}
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-700">Search by name</div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Doctor name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
                    <input value={qDoctor} onChange={(e)=>setQDoctor(e.target.value)}
                           placeholder="e.g. Sharma" className="w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Patient name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
                    <input value={qPatient} onChange={(e)=>setQPatient(e.target.value)}
                           placeholder="e.g. Rakesh" className="w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hospital name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
                    <input value={qHospital} onChange={(e)=>setQHospital(e.target.value)}
                           placeholder="e.g. Fortis" className="w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                </div>
              </div>
              
              {/* status + reply */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <div className="flex flex-wrap items-center gap-x-4">
                    <StatusCheckbox value="approved" label="Approved" />
                    <StatusCheckbox value="pending" label="Pending" />
                    <StatusCheckbox value="rejected" label="Rejected" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Has reply</label>
                  <select value={hasReply} onChange={(e)=>setHasReply(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500">
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              {/* rating + dates */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="5" step="1" value={ratingMin}
                           onChange={(e)=>setRatingMin(e.target.value)}
                           placeholder="Min ★" className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500"/>
                    <span className="text-gray-400">–</span>
                    <input type="number" min="1" max="5" step="1" value={ratingMax}
                           onChange={(e)=>setRatingMax(e.target.value)}
                           placeholder="Max ★" className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)}
                           className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500"/>
                    <input type="date" value={to} onChange={(e)=>setTo(e.target.value)}
                           className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button onClick={onApply}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-5 py-2.5 hover:bg-indigo-700 font-medium text-sm transition-colors">
                Apply Filters
              </button>
              <button onClick={onClear}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 text-gray-700 px-5 py-2.5 hover:bg-gray-50 font-medium text-sm transition-colors">
                Clear
              </button>
            </div>
          </div>

          {/* stats */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {statsLoading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500 py-4"><Loader2 className="w-5 h-5 animate-spin" /> Loading stats…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-600">Total reviews</div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.count ?? 0}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Average rating</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-gray-900">{(stats?.avg ?? 0).toFixed(2)}</div>
                    <StarsPrecise value={stats?.avg ?? 0} size={20} />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Distribution</div>
                  <div className="space-y-1">
                    {[5,4,3,2,1].map(s => {
                      const cnt = stats?.distribution?.[s] ?? 0;
                      const pct = (stats?.count ? Math.round((cnt / stats.count) * 100) : 0);
                      return (
                        <div key={s} className="flex items-center gap-2 text-xs">
                          <span className="w-5 text-right font-medium text-gray-700">{s}★</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-right text-gray-600">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* list */}
          <div className="space-y-6">
            {isLoading && !items.length ? (
              <div className="py-12 text-center text-gray-500">
                <Loader2 className="w-6 h-6 inline-block animate-spin mb-3" />
                <p className="font-semibold">Loading reviews...</p>
              </div>
            ) : isError ? (
              <div className="text-center text-rose-600 p-8 rounded-xl bg-rose-50 border border-rose-200">
                <p className="font-medium">Failed to load reviews.</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="font-semibold">No reviews found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {items.map(r => (<Row key={r._id} r={r} />))}
              </div>
            )}

            {hasNextPage && (
              <div ref={sentinelRef} className="h-10 flex items-center justify-center text-sm text-gray-500">
                {isFetchingNextPage ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading more…
                  </span>
                ) : (
                  <span>Scroll to load more</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deletingReviewId}
        title="Confirm Deletion"
        message="Are you sure you want to delete this review? This action cannot be undone."
        onCancel={() => setDeletingReviewId(null)}
        onConfirm={executeDelete}
        variant="destructive"
        confirmText="Delete Review"
        cancelText="Cancel"
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
      />
    </>
  );
}
