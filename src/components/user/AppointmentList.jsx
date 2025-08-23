import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Stethoscope,
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Star,
  Trash2,
  Pencil
} from 'lucide-react';
import AxiosInstances from '../../apiManager/index';
import dayjs from 'dayjs';

const MIN_REVIEW_LEN = 20;
const PAGE_SIZE = 10; // adjust or make it a query param selector

const AppointmentList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Server data
  const [appointments, setAppointments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState('create'); // 'create' | 'edit'
  const [activeAptId, setActiveAptId] = useState(null);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Lock body scroll when modal open
  useEffect(() => {
    if (!reviewModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [reviewModalOpen]);

  // Determine status from route
  const getStatusFromPath = () => {
    if (location.pathname.includes('upcoming')) return 'Confirmed';
    if (location.pathname.includes('past')) return 'Completed';
    if (location.pathname.includes('cancelled')) return 'Cancelled';
    return '';
  };
  const status = getStatusFromPath();

  // Fetch appointments (server-driven, paginated, with review + flags)
  const loadAppointments = async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await AxiosInstances.get('/user/appointments', {
        params: { status, page: targetPage, limit: PAGE_SIZE }
      });
      const { items = [], totalPages = 1, hasPrev = false, hasNext = false, page: serverPage = 1 } = res.data || {};
      setAppointments(items);
      setTotalPages(totalPages);
      setHasPrev(hasPrev);
      setHasNext(hasNext);
      setPage(serverPage);
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  // Reload when status or page changes
  useEffect(() => {
    // when changing tabs (status), reset to page 1
    setPage(1);
  }, [status]);

  useEffect(() => {
    if (!status) return;
    loadAppointments(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  // Helpers (now server-driven)
  const canWriteReview = (apt) => apt?.status === 'Completed' && apt?.reviewExists === false;
  const canEditReview = (apt) => apt?.canEdit === true;

  const openCreateReview = (apt) => {
    setReviewMode('create');
    setActiveAptId(apt._id);
    setActiveReviewId(null);
    setRating(0);
    setText('');
    setFormError('');
    setReviewModalOpen(true);
  };

  const openEditReview = (apt) => {
    setReviewMode('edit');
    setActiveAptId(apt._id);
    setActiveReviewId(apt.review?._id || null);
    setRating(Number(apt.review?.rating_overall) || 0);
    setText(apt.review?.text || '');
    setFormError('');
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    if (submitting) return;
    setReviewModalOpen(false);
  };

  const validateForm = () => {
    if (rating < 1 || rating > 5) return 'Please select a rating from 1 to 5.';
    if ((text || '').trim().length < MIN_REVIEW_LEN) return `Review must be at least ${MIN_REVIEW_LEN} characters.`;
    return '';
  };

  // Create or update review (server is source of truth → refetch page)
  const submitReview = async () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setSubmitting(true);
    try {
      if (reviewMode === 'create') {
        // POST /reviews
        await AxiosInstances.post('/reviews', {
          appointmentId: activeAptId,
          text: text.trim(),
          rating_overall: rating
        });
      } else {
        // PATCH /reviews/:id
        await AxiosInstances.patch(`/reviews/${activeReviewId}`, {
          text: text.trim(),
          rating_overall: rating
        });
      }
      setReviewModalOpen(false);
      // Refetch current page to reflect server state
      await loadAppointments(page);
    } catch (e) {
      setFormError('Failed to save review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review (any time) → refetch page
  const deleteReview = async (apt, e) => {
    e.stopPropagation();
    if (!apt?.reviewExists || !apt?.review?._id) return;
    const ok = window.confirm('Delete your review? This cannot be undone.');
    if (!ok) return;
    try {
      await AxiosInstances.delete(`/reviews/${apt.review._id}`);
      await loadAppointments(page);
    } catch (e) {
      alert('Failed to delete review. Try again.');
    }
  };

  // Star picker (for modal)
  const StarInput = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="p-1"
          aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
        >
          <Star className={`w-6 h-6 ${s <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );

  // Static mappings
  const getStatusDisplay = (appointmentStatus) => {
    switch (appointmentStatus) {
      case 'Confirmed':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600 bg-green-50', text: 'Confirmed' };
      case 'Completed':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50', text: 'Completed' };
      case 'Cancelled':
        return { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600 bg-red-50', text: 'Cancelled' };
      default:
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50', text: 'Unknown' };
    }
  };

  // Pagination controls
  const goPrev = () => hasPrev && setPage((p) => Math.max(1, p - 1));
  const goNext = () => hasNext && setPage((p) => p + 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {status} Appointments
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="px-3 py-1.5 rounded border disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="px-3 py-1.5 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            No {status} appointments found
          </h3>
          <p className="text-gray-500 text-sm">
            Your {status} appointments will appear here when available.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, index) => {
            const statusDisplay = getStatusDisplay(apt.status);
            const showWrite = canWriteReview(apt);
            const showEdit = canEditReview(apt);
            const showDelete = Boolean(apt?.reviewExists && apt?.review?._id);

            return (
              <div
                key={apt._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                onClick={() => navigate(`/appointment/${apt._id}`)}
              >
                {/* Row header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                      #{(page - 1) * PAGE_SIZE + index + 1}
                    </span>
                  </div>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                    {statusDisplay.icon}
                    <span>{statusDisplay.text}</span>
                  </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  {/* Patient */}
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs">Patient</p>
                      <p className="font-medium text-gray-800 truncate">
                        {apt.patient?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Doctor (new shape: doctor.user.name) */}
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs">Doctor</p>
                      <p className="font-medium text-gray-800 truncate">
                        Dr. {apt.doctor?.user?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs">Specialization</p>
                      <p className="font-medium text-gray-800 truncate">
                        {apt.doctor?.specialization || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Fee */}
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs">Fee</p>
                      <p className="font-semibold text-gray-800">
                        ₹{apt.doctor?.fee ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Review actions - server driven */}
                {apt.status === 'Completed' && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {showWrite && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openCreateReview(apt); }}
                        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm"
                      >
                        Write a review
                      </button>
                    )}

                    {apt.reviewExists && apt.review?._id && (
                      <>
                        <div className="text-sm text-gray-600">
                          <span className="mr-2 align-middle">Your review:</span>
                          <span className="inline-flex align-middle">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${s <= (apt.review.rating_overall || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </span>
                        </div>

                        {showEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditReview(apt); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm"
                            title={`Edit until ${apt.canEditUntil ? dayjs(apt.canEditUntil).format('DD MMM YYYY, HH:mm') : ''}`}
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                        )}

                        {showDelete && (
                          <button
                            onClick={(e) => deleteReview(apt, e)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm text-red-600 border-red-200 hover:bg-red-50"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}

                        {!showEdit && (
                          <span className="text-xs text-gray-400">(Edit window closed)</span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination footer (duplicate controls at bottom for convenience) */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          className="px-3 py-1.5 rounded border disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={goNext}
          disabled={!hasNext}
          className="px-3 py-1.5 rounded border disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeReviewModal}
            aria-hidden="true"
          />

          {/* Centered panel */}
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={reviewMode === 'create' ? 'Write a review' : 'Edit review'}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-xl ring-1 ring-black/5
                   animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">
                  {reviewMode === 'create' ? 'Write a review' : 'Edit review'}
                </h2>
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={closeReviewModal}
                  aria-label="Close review modal"
                  disabled={submitting}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Rating */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (1–5)
                </label>
                <div className="mb-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                    >
                      <Star className={`w-6 h-6 ${s <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                  Your review <span className="text-gray-400">(min {MIN_REVIEW_LEN} characters)</span>
                </label>
                <textarea
                  className="w-full border rounded-md p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={5}
                  placeholder="Share your experience…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={800}
                />

                {formError && (
                  <div className="mt-3 text-sm text-red-600">{formError}</div>
                )}

                {/* Actions */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={submitReview}
                    disabled={submitting}
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60"
                  >
                    {submitting ? 'Saving…' : reviewMode === 'create' ? 'Submit review' : 'Save changes'}
                  </button>
                  <button
                    onClick={closeReviewModal}
                    disabled={submitting}
                    className="px-4 py-2 rounded-md border"
                  >
                    Cancel
                  </button>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  You can edit your review within 24 hours of posting. You may delete it at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppointmentList;
