import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import AxiosInstances from '../apiManager';
import DoctorCard from '../components/DoctorCard';
import { MapPin, Search, Award, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import NavBar from '../components/NavBar';
import { makePublicUrlFromKey } from '../utils/s3PublicUrl';
import { renderStars } from '../utils/reviewUtils';
import ReviewCard from '../components/ReviewCard';
import ReviewsModal from '../components/ReviewsModal';
import dayjs from 'dayjs';
import { formatIST } from '../utils/datetime';

const PAGE_SIZE = 3;
const REVIEWS_PREVIEW_LIMIT = 2;
const REVIEWS_PAGE_SIZE = 10;

/* ---------------------- API ---------------------- */
const fetchHospital = async (hospitalId) => {
  const res = await AxiosInstances.get(`/hospitals/${hospitalId}`);
  return res.data;
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
  return res.data;
};

const fetchHospitalReviewsPreview = async (hospitalId) => {
  const params = { page: 1, limit: REVIEWS_PREVIEW_LIMIT };
  const res = await AxiosInstances.get(`/hospitals/${hospitalId}/reviews`, { params });
  return res.data;
};

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

  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const sentinelRef = useRef(null);
  const scrollRef = useRef(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const reviewsSentinelRef = useRef(null);
  const reviewsScrollRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(modalSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [modalSearch]);

  useEffect(() => {
    if (modalOpen || reviewsModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [modalOpen, reviewsModalOpen]);

  const {
    data: hospital,
    isLoading: hospitalLoading,
    error: hospitalError,
  } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => fetchHospital(hospitalId),
    enabled: !!hospitalId,
  });

  const {
    data: specializations = [],
    isLoading: specsLoading,
    error: specsError,
  } = useQuery({
    queryKey: ['specializations', hospitalId],
    queryFn: () => fetchSpecializations(hospitalId),
    enabled: !!hospitalId,
  });

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

  const doctors = data?.pages?.flatMap((p) => p?.data || []) || [];
  const limitedDoctors = data?.pages?.[0]?.data || [];
  const firstPageHasMore = data?.pages?.[0]?.hasMore === true;

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
    enabled: !!hospitalId && reviewsModalOpen,
  });

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
  const totalImages = hospital?.images?.length || 0;
  const nextImage = () => setSelectedImageIndex((i) => (i + 1) % totalImages);
  const prevImage = () => setSelectedImageIndex((i) => (i - 1 + totalImages) % totalImages);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-20 py-4">
      <NavBar />
      <div className="relative max-w-7xl mx-auto mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">

          {/* --- MODIFICATION HERE: Added grid container --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* --- Left Column (Images) --- */}
            {/* MODIFIED: Stays 16:9 on mobile, but stretches to full height on large screens */}
            <div className="relative aspect-[16/9]  lg:h-full bg-gray-200">
              {totalImages ? (
                <img
                  src={hospital.images[selectedImageIndex]}
                  alt={hospital.name}
                  className="w-full h-full object-cover" // This stretches to fill the container
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

            {/* --- Right Column (Data) --- */}
            <div className="p-8">
              <div className="mb-6">
                <h1 className=" text-lg sm:text-2xl font-bold text-gray-900 mb-2">{hospital.name}</h1>
                {
                  
                  
                  typeof hospital.ratingAvg !== 'undefined' && (
                    <div className="flex items-center ">
                      <span className='text-sm text-gray-600'>{hospital.ratingAvg}</span>
                      <span className="text-2xl font-bold text-gray-900 mr-1">{hospital.rating}</span>
                      {renderStars(hospital.ratingAvg)
                      }
                      
                      {typeof hospital.ratingCount !== 'undefined' && (
                        <span className="text-gray-600 ml-2">({hospital.ratingCount} reviews)</span>
                      )}
                    </div>
                  )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2 text-red-500" />
                    <span>{hospital.location || '—'}</span>
                  </div>
                </div>
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
          {/* --- END MODIFICATION --- */}

        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-6">Available Tests</h2>
          <div className="flex flex-wrap gap-3">
            {availableTests.map((name, i) => (
              <span key={i} className="px-4 py-2 border border-blue-200 text-blue-700 rounded-full bg-blue-50/40 font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className=" text-lg sm:text-2xl font-bold text-gray-900">Doctors</h2>
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
                  nextAvailability={
                    doctor?.nextAvailability?.dateTime
                      ? dayjs(doctor.nextAvailability.dateTime).format('dddd, MMMM D, YYYY h:mm A')
                      : 'No slots available'
                  }
                  consultationFee={doctor.fee}
                  profilePicture={
                    makePublicUrlFromKey(doctor.userId?.profilePicture) ||
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className=" text-lg sm:text-2xl font-bold text-gray-900">Patient Reviews</h2>
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
          {
            console.log(previewReviews)
          }
          <div className="space-y-6">
            {previewReviews.map((r) => (
              <ReviewCard key={r._id} r={r} />
            ))}
          </div>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-white" role="dialog" aria-modal="true">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
            <div className="max-w-7xl mx-auto p-4 relative pr-14">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X />
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold mr-auto">All Doctors</h2>
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
          <div ref={scrollRef} className="max-w-7xl mx-auto p-6 overflow-y-auto h-[calc(100vh-76px)]">
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
                      makePublicUrlFromKey(doctor.userId?.profilePicture) ||
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
      <ReviewsModal
        isOpen={reviewsModalOpen}
        onClose={() => setReviewsModalOpen(false)}
        reviews={modalReviews}
        totalReviews={previewTotal}
        onLoadMore={fetchNextReviewsPage}
        isLoadingMore={isFetchingNextReviews}
        hasMore={hasNextReviewsPage}
        loadingError={reviewsInfiniteError}
        sentinelRef={reviewsSentinelRef}
        scrollRef={reviewsScrollRef}
        entityName='Hospital'
      />
    </div>
  );
};

export default HospitalPage;