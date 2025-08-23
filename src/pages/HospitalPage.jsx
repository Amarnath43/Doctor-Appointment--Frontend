import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import AxiosInstances from '../apiManager';
import DoctorCard from '../components/DoctorCard';
import { Star, MapPin, Search, Award, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import NavBar from '../components/NavBar';
import { formatIST } from '../utils/datetime'; // dayjs-based IST formatter
import { makePublicUrlFromKey } from '../utils/s3PublicUrl';

const PAGE_SIZE = 2;                 // doctors page size (existing)
const REVIEWS_PREVIEW_LIMIT = 2;     // show 2 reviews on page
const REVIEWS_PAGE_SIZE = 10;        // 10 reviews per page in modal

/* ---------------------- API ---------------------- */
const fetchHospital = async (hospitalId) => {
  const res = await AxiosInstances.get(`/hospitals/${hospitalId}`);
  return res.data; // { name, images, description, ... }
};

const fetchSpecializations = async (hospitalId) => {
  const res = await AxiosInstances.get(`/hospitals/${hospitalId}/specialization`);
  return res.data?.specializations || [];
};

const fetchDoctorsPage = async ({ hospitalId, filter, search, pageParam = 1 }) => {
  const params = { page: pageParam, limit: PAGE_SIZE };
  if (filter) params.specialization = filter;
  if (search) params.search = search;
  const res = await AxiosInstances.get(`/hospitals/${hospitalId}/doctors`, { params });
  return res.data; // { data: Doctor[], hasMore: boolean }
};

// Reviews preview: first 2
const fetchHospitalReviewsPreview = async (hospitalId) => {
  const params = { page: 1, limit: REVIEWS_PREVIEW_LIMIT };
  const res = await AxiosInstances.get(`/hospitals/${hospitalId}/reviews`, { params });
  return res.data; // { items, total, page, limit }
};

// Reviews for modal (paginated, 10/page)
const fetchHospitalReviewsPage = async ({ hospitalId, pageParam = 1 }) => {
  const params = { page: pageParam, limit: REVIEWS_PAGE_SIZE };
  const res = await AxiosInstances.get(`/hospitals/${hospitalId}/reviews`, { params });
  return {
    items: res.data?.items || [],
    hasMore: (res.data?.items?.length || 0) === REVIEWS_PAGE_SIZE,
  };
};

/* -------------------- Component ------------------- */
const HospitalPage = () => {
  const { hospitalId } = useParams();

  // Doctors modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Doctors modal scroll
  const sentinelRef = useRef(null);
  const scrollRef = useRef(null);

  // Carousel (hospital images)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);


  // Reviews modal state + refs
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const reviewsScrollRef = useRef(null);
  const reviewsSentinelRef = useRef(null);

  // Debounce modal doctor search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(modalSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [modalSearch]);

  // Lock/unlock body scroll when any modal toggles
  useEffect(() => {
    if (modalOpen || reviewsModalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [modalOpen, reviewsModalOpen]);

  // Hospital details
  const {
    data: hospital,
    isLoading: hospitalLoading,
    error: hospitalError,
  } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => fetchHospital(hospitalId),
    enabled: !!hospitalId,
  });

  // Available specializations
  const {
    data: specializations = [],
    isLoading: specsLoading,
    error: specsError,
  } = useQuery({
    queryKey: ['specializations', hospitalId],
    queryFn: () => fetchSpecializations(hospitalId),
    enabled: !!hospitalId,
  });

  // Doctors (infinite)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: doctorsLoading,
    error: doctorsError,
  } = useInfiniteQuery({
    queryKey: ['doctors', hospitalId, filter, debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      fetchDoctorsPage({ hospitalId, filter, search: debouncedSearch, pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage?.hasMore ? pages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !!hospitalId,
  });

  // Flattened doctors for modal, and first page for main grid
  const doctors = data?.pages?.flatMap((p) => p?.data || []) || [];
  const limitedDoctors = data?.pages?.[0]?.data || [];
  const firstPageHasMore = data?.pages?.[0]?.hasMore === true;

  // Doctors modal infinite scroll trigger
  useEffect(() => {
    if (!modalOpen || !hasNextPage) return;

    const rootEl = scrollRef.current || null;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { root: rootEl, rootMargin: '0px', threshold: 1 }
    );

    const el = sentinelRef.current;
    if (el) obs.observe(el);

    return () => obs.disconnect();
  }, [modalOpen, hasNextPage, fetchNextPage]);

  /* ----------- Reviews: preview (2) ----------- */
  const {
    data: reviewsPreviewData,
    isLoading: reviewsPreviewLoading,
    error: reviewsPreviewError,
  } = useQuery({
    queryKey: ['hospitalReviewsPreview', hospitalId],
    queryFn: () => fetchHospitalReviewsPreview(hospitalId),
    enabled: !!hospitalId,
  });

  const previewReviews = reviewsPreviewData?.items || [];
  const previewTotal = reviewsPreviewData?.total || 0;

  /* ----------- Reviews: modal (infinite, 10/page) ----------- */
  const {
    data: reviewsInfiniteData,
    fetchNextPage: fetchNextReviewsPage,
    hasNextPage: hasNextReviewsPage,
    isFetchingNextPage: isFetchingNextReviews,
    isLoading: reviewsInfiniteLoading,
    error: reviewsInfiniteError,
  } = useInfiniteQuery({
    queryKey: ['hospitalReviewsAll', hospitalId],
    queryFn: ({ pageParam = 1 }) =>
      fetchHospitalReviewsPage({ hospitalId, pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage?.hasMore ? pages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !!hospitalId && reviewsModalOpen, // only load when modal opens
  });

  // Reviews modal infinite scroll
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

  const modalReviews = reviewsInfiniteData?.pages?.flatMap((p) => p.items) || [];

  if (hospitalLoading || specsLoading || doctorsLoading || reviewsPreviewLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen min-w-screen">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  }
  if (hospitalError || specsError || doctorsError || reviewsPreviewError) {
    return <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      <p className="mt-4 text-gray-600 font-medium">Error Loading Data...</p>
    </div>
  }

  const availableTests = ['Blood Test', 'MRI Scan', 'CT Scan', 'X-Ray', 'COVID-19 Test'];

  const renderStars = (rating, size = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    const val = Number(rating) || 0;
    const fullStars = Math.floor(val);
    const percent = (val - fullStars) * 100;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          const isFull = i < fullStars;
          const isFractional = i === fullStars && percent > 0;

          // Use a unique ID for the mask to avoid conflicts if there are multiple star components
          const maskId = `mask-stars-${Math.random().toString(36).substring(2, 9)}`;

          return (
            <svg
              key={i}
              className={`${sizeClass}`}
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

  const totalImages = hospital?.images?.length || 0;
  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % totalImages);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + totalImages) % totalImages);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-20 py-4">
      <NavBar />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hospital Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Image Gallery */}
          <div className="relative h-80 bg-gray-200">
            {totalImages ? (
              <img
                src={hospital.images[selectedImageIndex]}
                alt={hospital.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/default-hospital.png'; }}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-gray-400">No image</div>
            )}

            {totalImages > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {hospital.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${index === selectedImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}

            {totalImages > 1 && (
              <>
                <button onClick={prevImage} className="absolute top-1/2 left-4 -translate-y-1/2 bg-white p-2 rounded-full shadow" aria-label="Previous">
                  <ChevronLeft />
                </button>
                <button onClick={nextImage} className="absolute top-1/2 right-4 -translate-y-1/2 bg-white p-2 rounded-full shadow" aria-label="Next">
                  <ChevronRight />
                </button>
              </>
            )}
          </div>

          {/* Hospital Info */}
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mr-4">{hospital.name}</h1>
                  {typeof hospital.rating !== 'undefined' && (
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900 mr-2">{hospital.rating}</span>
                      {renderStars(hospital.rating, 'md')}
                      {typeof hospital.reviewCount !== 'undefined' && (
                        <span className="text-gray-600 ml-2">({hospital.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}
                </div>

                {typeof hospital.avgDoctorRating !== 'undefined' && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <Award className="w-5 h-5 mr-2 text-blue-500" />
                    <span className="font-medium">Average Doctor Rating: {hospital.avgDoctorRating}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2 text-red-500" />
                  <span>{hospital.location || '—'}</span>
                </div>
              </div>

              {/* Available Specializations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {specializations.length ? (
                    specializations.map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No specializations</span>
                  )}
                </div>
              </div>
            </div>

            {hospital.description && <p className="text-gray-700 leading-relaxed">{hospital.description}</p>}
          </div>
        </div>

        {/* Available Tests */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Tests</h2>
          <div className="flex flex-wrap gap-3">
            {availableTests.map((name, i) => (
              <span key={i} className="px-4 py-2 border border-blue-200 text-blue-700 rounded-full bg-blue-50/40 font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Doctors Section (first page only) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Doctors</h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {limitedDoctors.map((doctor) => (
              <li key={doctor._id}>
                <DoctorCard
                  id={doctor._id}
                  name={doctor.userId?.name || 'Unknown'}
                  specialty={doctor.specialization}
                  experience={doctor.experience}
                  hospital={doctor.hospital?.name || 'Unknown Clinic'}
                  location={doctor.hospital?.location || 'Unknown Location'}
                  nextAvailability={doctor?.nextAvailability?.dateTime || 'No slots available'}
                  consultationFee={doctor.fee}
                  profilePicture={
                    makePublicUrlFromKey(doctor.userId?.profilePicture)
                    ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.userId?.name || 'Doctor')}&background=random`
                  }
                  onClick={(id) => console.log('Clicked:', id)}
                />
              </li>
            ))}
          </ul>

          {firstPageHasMore && (
            <div className="mt-6 text-center">
              <button onClick={() => setModalOpen(true)} className="px-6 py-2 bg-blue-600 text-white rounded-md">
                View All Doctors
              </button>
            </div>
          )}
        </div>

        {/* Patient Reviews (Preview: 2) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Patient Reviews</h2>
            {!!previewTotal && (
              <button
                onClick={() => setReviewsModalOpen(true)}
                className="px-4 py-2 rounded-md bg-blue-600 text-white"
              >
                See all reviews
              </button>
            )}
          </div>

          {!previewReviews.length && (
            <div className="text-gray-500">No reviews yet.</div>
          )}

          <div className="space-y-6">
            {previewReviews.map((r) => (
              <article
                key={r._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Header with user + date + stars */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    {/* User avatar */}
                    <img
                      src={makePublicUrlFromKey(r.user?.profilePicture)}
                      alt={r.user?.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                      loading="lazy"
                    />

                    {/* Name + rating/date */}
                    <div>
                      <div className="font-bold text-gray-900">{r.user?.name || 'Anonymous'}</div>
                      <div className="mt-1 flex items-center text-sm text-gray-600">
                        <div className="flex items-center [&>svg]:text-amber-500 [&>svg]:fill-amber-500">
                          {renderStars(r.rating)}
                        </div>
                        <span className="mx-2 text-gray-300">•</span>
                        <time dateTime={r.createdAt} className="shrink-0 text-xs text-gray-500">
                          {formatIST(r.createdAt, 'DD MMM YYYY, hh:mm A')}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review text */}
                {r.comment && (
                  <p className="mt-4 text-gray-800 leading-normal whitespace-pre-wrap">
                    {r.comment}
                  </p>
                )}

                {/* Doctor reply */}
                {r.doctor_reply?.text && (
                  <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-inner">
                    <div className="text-xs font-semibold text-gray-500">
                      Doctor response <span className="text-gray-400 font-normal">•</span>{' '}
                      {formatIST(r.doctor_reply.repliedAt, 'DD MMM YYYY')}
                    </div>
                    <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {r.doctor_reply.text}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

        </div>

        {/* Modal: All Doctors (existing) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-white" role="dialog" aria-modal="true">
            {/* Sticky header with reserved space for X */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
              <div className="max-w-7xl mx-auto p-4 relative pr-14">
                {/* Close button pinned to top-right */}
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <X />
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold mr-auto">All Doctors</h2>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      placeholder="Search doctors…"
                      className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-72"
                    />
                  </div>

                  {/* Specialization */}
                  <select
                    value={filter}
                    onChange={(e) => {
                      setModalSearch('');
                      setFilter(e.target.value);
                    }}
                    className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">All specializations</option>
                    {(specializations || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Scrollable body (only this area scrolls) */}
            <div
              ref={scrollRef}
              className="max-w-7xl mx-auto p-6 overflow-y-auto h-[calc(100vh-76px)]"
            >
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doctor) => (
                  <li key={doctor._id}>
                    <DoctorCard
                      id={doctor._id}
                      name={doctor.userId?.name || doctor.user?.name || 'Unknown'}
                      specialty={doctor.specialization}
                      experience={doctor.experience}
                      hospital={doctor.hospital?.name || 'Unknown Clinic'}
                      location={doctor.hospital?.location || 'Unknown Location'}
                      nextAvailability={doctor?.nextAvailability?.dateTime || 'No slots available'}
                      consultationFee={doctor.fee}
                      profilePicture={
                        doctor.userId?.profilePicture ||
                        doctor.user?.profilePicture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          doctor.userId?.name || doctor.user?.name || 'Doctor'
                        )}&background=random`
                      }
                      onClick={(id) => console.log('Clicked:', id)}
                    />
                  </li>
                ))}
              </ul>

              {!doctors.length && (
                <div className="text-center text-gray-500 mt-8">No doctors match your search.</div>
              )}

              {hasNextPage && <div ref={sentinelRef} className="h-1" />}
              {isFetchingNextPage && <div className="text-center mt-4">Loading more...</div>}
            </div>
          </div>
        )}

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
              {/* Header — compact and efficient */}
              <div className="flex-shrink-0 sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h2 id="reviews-title" className="text-xl font-bold text-gray-900">
                        All Reviews
                      </h2>
                      {/* Compact Stats row */}
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
                                ? modalReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / modalReviews.length
                                : 0
                            )}
                          </div>
                        </div>
                        <span className="text-gray-500">
                          Based on {modalReviews.length} reviews
                        </span>
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

                  {/* Condensed Distribution Chart */}
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
              </div>

              {/* Body */}
              <div
                ref={reviewsScrollRef}
                className="flex-grow overflow-y-auto px-4 sm:px-6 py-6"
                aria-live="polite"
                aria-busy={reviewsInfiniteLoading ? 'true' : 'false'}
              >
                {/* Loading (first page) */}
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

                {/* Error */}
                {reviewsInfiniteError && (
                  <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    <span className="font-medium">Failed to load reviews.</span>
                    <span className="text-red-600">Please try again.</span>
                  </div>
                )}

                {/* Empty */}
                {!modalReviews.length && !reviewsInfiniteLoading && !reviewsInfiniteError && (
                  <div className="text-center text-gray-500 py-16">
                    <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    </div>
                    <p className="font-medium">No reviews yet.</p>
                    <p className="text-sm">New reviews will appear here.</p>
                  </div>
                )}

                {/* List — improved spacing and visual hierarchy */}
                <div className="space-y-4">
                  {modalReviews.map((r) => (
                    <article
                      key={r._id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Header — improved visual hierarchy */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={makePublicUrlFromKey(r.user?.profilePicture)}
                            alt={r.user?.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate text-sm">
                              {r.user?.name || 'Anonymous'}
                            </div>
                            <div className="mt-0.5 flex items-center text-xs text-gray-600">
                              <div className="flex items-center [&>svg]:text-amber-500 [&>svg]:fill-amber-500">
                                {renderStars(r.rating)}
                              </div>
                              <span className="mx-2 text-gray-300">•</span>
                              <time dateTime={r.createdAt} className="shrink-0">
                                {formatIST(r.createdAt, 'DD MMM YYYY')}
                              </time>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comment — improved readability */}
                      {r.comment && (
                        <p className="mt-3 text-gray-800 leading-normal whitespace-pre-wrap text-sm">
                          {r.comment}
                        </p>
                      )}

                      {/* Doctor reply — visually distinct */}
                      {r.doctor_reply?.text && (
                        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 shadow-inner">
                          <div className="text-xs font-semibold text-gray-500">
                            Doctor Response <span className="text-gray-400 font-normal">•</span> <time dateTime={r.doctor_reply.repliedAt}>{formatIST(r.doctor_reply.repliedAt, 'DD MMM YYYY')}</time>
                          </div>
                          <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {r.doctor_reply.text}
                          </div>
                        </div>
                      )}
                    </article>
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



      </div>
    </div>
  );
};

export default HospitalPage;
