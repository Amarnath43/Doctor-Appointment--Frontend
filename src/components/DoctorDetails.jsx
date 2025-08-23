import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import AxiosInstances from '../apiManager';
import toast from 'react-hot-toast';
import { X, Star, Loader2 } from 'lucide-react';
import { formatIST } from '../utils/datetime';
import { makePublicUrlFromKey } from '../utils/s3PublicUrl';
import ConfirmationModal from './ConfirmationModal';

const REVIEWS_PREVIEW_LIMIT = 2; // show 2 on page
const REVIEWS_PAGE_SIZE = 10;    // 10 per page in modal

/* ---------------------- API ---------------------- */
const fetchDoctor = async (doctorId) => {
  const res = await AxiosInstances.get(`/doctor/${doctorId}`);
  return res.data;
};

const fetchAppointmentById = async (appointmentId) => {
  const res = await AxiosInstances.get(`/appointments/${appointmentId}`);
  return res.data;
};

const fetchDoctorReviewsPreview = async (doctorId) => {
  const params = { page: 1, limit: REVIEWS_PREVIEW_LIMIT };
  const res = await AxiosInstances.get(`/doctors/${doctorId}/reviews`, { params });
  return res.data; // { items, total, page, limit }
};

const fetchDoctorReviewsPage = async ({ doctorId, pageParam = 1 }) => {
  const params = { page: pageParam, limit: REVIEWS_PAGE_SIZE };
  const res = await AxiosInstances.get(`/doctors/${doctorId}/reviews`, { params });
  return {
    items: res.data?.items || [],
    hasMore: (res.data?.items?.length || 0) === REVIEWS_PAGE_SIZE,
  };
};

/* ---------------------- Responsive Review Card (IMPROVED UI) ---------------------- */
const ReviewCard = ({ r, renderStars, dateFormat = 'DD MMM YYYY' }) => {
  const name = r?.user?.name || 'Anonymous';
  const avatar = makePublicUrlFromKey(r?.user?.profilePicture) || null;
  const created = r?.createdAt ? formatIST(r.createdAt, dateFormat) : '';
  const repliedAt = r?.doctor_reply?.repliedAt
    ? formatIST(r.doctor_reply.repliedAt, 'DD MMM YYYY')
    : '';

  return (
    <article className="w-full rounded-xl border border-gray-200 bg-white p-5 transition-shadow duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        {/* Avatar and Name */}
        <div className="flex min-w-0 items-center gap-4">
          <img
            src={avatar}
            alt={name}
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-100"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-800">{name}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              {renderStars(r.rating)}
              <span className="hidden sm:inline text-gray-300">•</span>
              <time className="hidden sm:inline shrink-0">{created}</time>
            </div>
          </div>
        </div>
        {/* Mobile Date */}
        <time className="sm:hidden text-xs text-gray-500 shrink-0 pt-1">{created}</time>
      </div>

      {/* Review Text */}
      {r.comment && (
        <p className="mt-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
          {r.comment}
        </p>
      )}

      {/* Doctor's Reply */}
      {r.doctor_reply?.text && (
        <div className="mt-4 rounded-lg bg-indigo-50/50 p-4 border border-indigo-100">
          <div className="text-xs font-semibold text-indigo-700">
            Response from the Doctor
            <span className="text-indigo-300 font-normal mx-2">•</span>
            <span className="font-normal text-indigo-600">{repliedAt}</span>
          </div>
          <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
            {r.doctor_reply.text}
          </p>
        </div>
      )}
    </article>
  );
};


/* ---------------------- Component (IMPROVED UI) ---------------------- */
const DoctorDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: doctorId } = useParams();

  const query = new URLSearchParams(location.search);
  const rescheduleFrom = query.get('rescheduleFrom');
  const navState = location.state || {};

  // Local UI state
  const [selectedDate, setSelectedDate] = useState(navState.selectedDate || '');
  const [selectedSlot, setSelectedSlot] = useState(navState.selectedSlot || '');

  // Reviews modal state + refs
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const reviewsScrollRef = useRef(null);
  const reviewsSentinelRef = useRef(null);


   const [isConfirming, setIsConfirming] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: null,
    onConfirm: () => {},
    confirmText: 'Confirm',
    variant: 'primary',
  });

  const closeModal = () => setModalState({ isOpen: false });

  const executeBooking = async () => {
    setIsConfirming(true);
    try {
      await handleBooking();
    } finally {
      setIsConfirming(false);
      closeModal();
    }
  };

  const executeReschedule = async () => {
    setIsConfirming(true);
    try {
      await handleReschedule();
    } finally {
      setIsConfirming(false);
      closeModal();
    }
  };

  const openConfirmationModal = () => {
    if (!selectedSlot) return;

    if (rescheduleFrom) {
      setModalState({
        isOpen: true,
        title: 'Confirm Reschedule',
        message: (
          <p>
            Move your appointment to{' '}
            <strong className="text-gray-800">{formatDateLabel(selectedDate)}</strong> at{' '}
            <strong className="text-gray-800">{selectedSlot}</strong>?
          </p>
        ),
        onConfirm: executeReschedule,
        confirmText: 'Reschedule',
        variant: 'primary',
      });
    } else {
      setModalState({
        isOpen: true,
        title: 'Confirm Your Booking',
        message: (
          <p>
            Book an appointment with{' '}
            <strong className="text-gray-800">Dr. {doctor?.userId?.name}</strong> for{' '}
            <strong className="text-gray-800">{selectedSlot}</strong> on{' '}
            <strong className="text-gray-800">{formatDateLabel(selectedDate)}</strong>.
          </p>
        ),
        onConfirm: executeBooking,
        confirmText: 'Book Now',
        variant: 'primary',
      });
    }
  };

  /* ----------- Data: Doctor ----------- */
  const {
    data: doctor,
    isLoading: doctorLoading,
    error: doctorError,
  } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => fetchDoctor(doctorId),
    enabled: !!doctorId,
  });

  const availableDates = doctor?.availability || [];

  useEffect(() => {
    if (!rescheduleFrom && !navState.selectedDate && availableDates.length && !selectedDate) {
      setSelectedDate(availableDates[0].date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates, rescheduleFrom, navState.selectedDate, selectedDate]);

  useEffect(() => {
    if (!navState.selectedDate) setSelectedSlot('');
  }, [selectedDate, navState.selectedDate]);

  const selectedSlots =
    availableDates.find((d) => d.date === selectedDate)?.slots || [];

  /* ----------- Data: Reschedule (only if present) ----------- */
  const {
    data: rescheduleInfo,
    isLoading: rescheduleLoading,
    error: rescheduleError,
  } = useQuery({
    queryKey: ['appointment', rescheduleFrom],
    queryFn: () => fetchAppointmentById(rescheduleFrom),
    enabled: !!rescheduleFrom,
  });

  useEffect(() => {
    if (rescheduleFrom && rescheduleInfo?.appointment?.date) {
      setSelectedDate(rescheduleInfo.appointment.date);
      setSelectedSlot('');
    }
  }, [rescheduleInfo, rescheduleFrom]);

  /* ----------- Reviews: preview (2) ----------- */
  const {
    data: reviewsPreviewData,
    isLoading: reviewsPreviewLoading,
    error: reviewsPreviewError,
  } = useQuery({
    queryKey: ['doctorReviewsPreview', doctorId],
    queryFn: () => fetchDoctorReviewsPreview(doctorId),
    enabled: !!doctorId,
  });

  const reviewsPreview = reviewsPreviewData?.items || [];
  const reviewsTotal = reviewsPreviewData?.total || 0;

  /* ----------- Reviews: modal (infinite) ----------- */
  const {
    data: reviewsInfiniteData,
    fetchNextPage: fetchNextReviewsPage,
    hasNextPage: hasNextReviewsPage,
    isFetchingNextPage: isFetchingNextReviews,
    isLoading: reviewsInfiniteLoading,
    error: reviewsInfiniteError,
  } = useInfiniteQuery({
    queryKey: ['doctorReviewsAll', doctorId],
    queryFn: ({ pageParam = 1 }) =>
      fetchDoctorReviewsPage({ doctorId, pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage?.hasMore ? pages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !!doctorId && reviewsModalOpen,
  });

  const modalReviews = reviewsInfiniteData?.pages?.flatMap((p) => p.items) || [];

  useEffect(() => {
    if (!reviewsModalOpen || !hasNextReviewsPage) return;

    const rootEl = reviewsScrollRef.current || null;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextReviewsPage(),
      { root: rootEl, rootMargin: '0px', threshold: 1 }
    );

    const el = reviewsSentinelRef.current;
    if (el) obs.observe(el);

    return () => obs.disconnect();
  }, [reviewsModalOpen, hasNextReviewsPage, fetchNextReviewsPage]);

  useEffect(() => {
    if (!reviewsModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [reviewsModalOpen]);

  /* ----------- Helpers ----------- */
  const formatDateLabel = (isoDate) =>
    new Date(isoDate)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      .toUpperCase();

  const renderStars = (rating) => {
    const val = Number(rating) || 0;
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${s <= val ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  /* ----------- Booking / Reschedule ----------- */
  const handleBooking = async () => {
    if (!selectedSlot) return;
    try {
      const payload = { doctorId, date: selectedDate, slot: selectedSlot };
      const { data } = await AxiosInstances.post('/appointments/book', payload);
      const appt = data.fullAppt;

      navigate('/appointment/success', {
        state: {
          appointmentData: {
            doctorName: appt.doctorId.userId.name,
            specialization: appt.doctorId.specialization,
            date: new Date(appt.date).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            }),
            time: appt.slot,
            location: appt.doctorId.hospital.location,
            fee: `₹${appt.doctorId.fee}`,
            appointmentId: appt._id
          }
        }
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        sessionStorage.setItem('pendingBooking', JSON.stringify({
          path: window.location.pathname,
          date: selectedDate,
          slot: selectedSlot
        }));
        navigate('/signin');
      }
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    try {
      await AxiosInstances.post(`/appointments/reschedule/${rescheduleFrom}`, {
        newDate: selectedDate,
        newSlot: selectedSlot,
      });
      toast.success('Appointment rescheduled successfully!');
      navigate('/user/dashboard/appointment-history/upcoming');
    } catch (err) {
      console.error('Reschedule failed', err);
      toast.error('Reschedule failed');
    }
  };

  /* ----------- Loading / Error ----------- */
  if (doctorLoading || reviewsPreviewLoading || rescheduleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="mt-4 text-gray-600 font-medium">Loading Doctor Details...</p>
      </div>
    );
  }
  if (doctorError || reviewsPreviewError || rescheduleError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mt-4 text-red-600 font-medium">Error Loading Data. Please try again.</p>
      </div>
    );
  }

  /* ---------------------- UI ---------------------- */
  return (
    <div className="bg-gray-50 min-h-screen mt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Column: Doctor Profile */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img
                    src={makePublicUrlFromKey(doctor?.userId?.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          doctor.userId?.name || doctor.user?.name || 'Doctor'
                        )}&background=random`}
                    alt={`Dr. ${doctor?.userId?.name}`}
                    className="h-32 w-32 rounded-full object-cover ring-4 ring-indigo-100"
                  />
                  <span className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-white">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  </span>
                </div>
                <h1 className="mt-5 text-2xl font-bold text-gray-900">Dr. {doctor?.userId?.name}</h1>
                <p className="mt-1 text-indigo-600 font-medium">{doctor?.specialization}</p>
                <div className="mt-3 inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {doctor?.experience} Years of Experience
                </div>
              </div>

              <hr className="my-6 border-gray-200" />

              <div>
                <h2 className="text-base font-semibold text-gray-800">About Dr. {doctor?.userId?.name.split(' ').pop()}</h2>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.
                </p>
                <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3">
                  <span className="text-sm font-medium text-gray-600">Appointment Fee</span>
                  <span className="text-lg font-bold text-gray-900">₹{doctor?.fee}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Scheduler & Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Reschedule Notice */}
            {rescheduleInfo?.appointment?.date && (
              <div className="p-4 bg-amber-50 text-amber-800 border-l-4 border-amber-400 rounded-r-lg">
                <p>
                  <strong>Rescheduling:</strong> Your original booking was for{' '}
                  <span className="font-semibold">
                    {new Date(rescheduleInfo.appointment.date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long'
                    })} at {rescheduleInfo.appointment.slot}
                  </span>.
                </p>
              </div>
            )}
            
            {/* Appointment Scheduler */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Book an Appointment</h2>
              
              {/* Date Picker */}
              {/* Date Picker */}
<div className="mt-5">
  <label className="text-sm font-medium text-gray-700">Select Date</label>
  <div className="mt-2">
    {/* --- CHECK ADDED HERE --- */}
    {availableDates.length > 0 ? (
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex space-x-3">
          {availableDates.map(({ date }) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                date === selectedDate
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              {formatDateLabel(date)}
            </button>
          ))}
        </div>
      </div>
    ) : (
      // --- THIS IS THE NEW EMPTY STATE MESSAGE ---
      <div className="text-center text-gray-500 bg-gray-50 rounded-lg py-8">
        <p>No appointment dates are currently available.</p>
        <p className="text-sm">Please check back later.</p>
      </div>
    )}
  </div>
</div>

             {/* Slot Picker (with Horizontal Scroll) */}
<div className="mt-5">
  <label className="text-sm font-medium text-gray-700">Select Time Slot</label>
  <div className="mt-2">
    {selectedSlots.length > 0 ? (
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex space-x-3">
          {selectedSlots.map(slot => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                slot === selectedSlot
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    ) : (
      <div className="text-center text-gray-500 bg-gray-50 rounded-lg py-8">
        <p>No slots available on this day.</p>
        <p className="text-sm">Please select another date.</p>
      </div>
    )}
  </div>
</div>

              {/* Action Button */}
              <div className="mt-8">
                <button
                  disabled={!selectedSlot}
                  className="w-full text-white font-bold px-6 py-4 rounded-lg text-base transition-all duration-300 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5"
                  
                  onClick={openConfirmationModal} 
                >
                  {rescheduleFrom ? 'Confirm Reschedule' : 'Book Appointment'}
                </button>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Patient Reviews</h2>
                {!!reviewsTotal && (
                  <button
                    onClick={() => setReviewsModalOpen(true)}
                    className="font-semibold text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    See all ({reviewsTotal})
                  </button>
                )}
              </div>
              
              {!reviewsPreview.length && (
                <div className="text-center text-gray-500 bg-gray-50 rounded-lg py-8">
                  <p>No reviews yet for this doctor.</p>
                </div>
              )}

              <div className="space-y-4">
                {reviewsPreview.map((r) => (
                  <ReviewCard key={r._id} r={r} renderStars={renderStars} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
            All Reviews Modal
      ========================== */}
      {reviewsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reviews-title"
          onKeyDown={(e) => e.key === 'Escape' && setReviewsModalOpen(false)}
          tabIndex={-1}
        >
          <div className="relative w-full max-w-5xl h-[90vh] rounded-lg sm:rounded-3xl bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h2 id="reviews-title" className="text-xl font-bold text-gray-900">
                      All Reviews
                    </h2>
                    <div className="mt-1 flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-gray-900">
                          {modalReviews.length
                            ? (
                                modalReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) /
                                modalReviews.length
                              ).toFixed(1)
                            : '—'}
                        </span>
                        <div className="ml-1 flex items-center [&>svg]:text-yellow-500 [&>svg]:fill-yellow-500">
                          {renderStars(
                            modalReviews.length
                              ? modalReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) /
                                modalReviews.length
                              : 0
                          )}
                        </div>
                      </div>
                      <span className="text-gray-500">
                        Based on {modalReviews.length} reviews
                      </span>
                    </div>

                    {/* Distribution */}
                    <div className="mt-3 grid grid-cols-1 gap-1">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = modalReviews.filter((r) => Number(r.rating) === stars).length;
                        const pct = modalReviews.length ? Math.round((count / modalReviews.length) * 100) : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2 text-xs">
                            <span className="w-6 text-right text-gray-700 tabular-nums">{stars}★</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-[width] duration-500"
                                style={{ width: `${pct}%` }}
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${pct}% ${stars}-star`}
                              />
                            </div>
                            <span className="w-8 text-right text-gray-600 tabular-nums">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setReviewsModalOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Close reviews modal"
                  >
                    <X className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div
              ref={reviewsScrollRef}
              className="flex-grow overflow-y-auto px-4 sm:px-6 py-6"
              aria-live="polite"
              aria-busy={reviewsInfiniteLoading ? 'true' : 'false'}
            >
              {reviewsInfiniteLoading && !modalReviews.length && (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="h-4 w-40 bg-gray-200 rounded" />
                      </div>
                      <div className="mt-3 h-3 w-3/4 bg-gray-200 rounded" />
                      <div className="mt-2 h-3 w-2/3 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {reviewsInfiniteError && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="font-medium">Failed to load reviews.</span>
                  <span className="text-red-600">Please try again.</span>
                </div>
              )}

              {!modalReviews.length && !reviewsInfiniteLoading && !reviewsInfiniteError && (
                <div className="text-center text-gray-500 py-16">
                  <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  </div>
                  <p className="font-medium">No reviews yet.</p>
                  <p className="text-sm">New reviews will appear here.</p>
                </div>
              )}

              {/* Responsive list */}
              <div className="space-y-4 sm:space-y-5">
                {modalReviews.map((r) => (
                  <ReviewCard
                    key={r._id}
                    r={r}
                    renderStars={renderStars}
                    dateFormat="DD MMM YYYY"
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              {hasNextReviewsPage && <div ref={reviewsSentinelRef} className="h-1" />}
              {isFetchingNextReviews && (
                <div className="text-center mt-5 text-sm text-gray-500">Loading more…</div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={closeModal}
        isConfirming={isConfirming}
        confirmText={modalState.confirmText}
        variant={modalState.variant}
      />
    </div>
  );
};

export default DoctorDetails;