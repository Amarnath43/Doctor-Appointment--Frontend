import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import AxiosInstances from '../apiManager';
import DoctorCard from '../components/DoctorCard';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 6;

// Fetch hospital details using axios and try/catch
const fetchHospital = async (hospitalId) => {
  try {
    const res = await AxiosInstances.get(`/hospitals/${hospitalId}`);
    return res.data; // { name, description, images }
  } catch (err) {
    console.error('Error fetching hospital:', err);
    return null;
  }
};

// Fetch specializations for filter
const fetchSpecializations = async (hospitalId) => {
  try {
    const res = await AxiosInstances.get(`/hospitals/${hospitalId}/specialization`);
    return res.data.specializations ||[]; 
  } catch (err) {
    console.error('Error fetching specializations:', err);
    return [];
  }
};

// Fetch a page of doctors with optional filter
const fetchDoctorsPage = async ({ hospitalId, filter, pageParam = 1 }) => {
  try {
    const params = { page: pageParam, limit: PAGE_SIZE };
    if (filter) params.specialization = filter;
    const res = await AxiosInstances.get(`/hospitals/${hospitalId}/doctors`, { params });
    return res.data; // { data: Doctor[], hasMore: boolean }
  } catch (err) {
    console.error('Error fetching doctors page:', err);
    return { data: [], hasMore: false };
  }
};

const HospitalPage = () => {
  const { hospitalId } = useParams();
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const sentinelRef = useRef(null);

  // Hospital details (v5 syntax)
  const {
    data: hospital,
    isLoading: hospitalLoading,
    error: hospitalError
  } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => fetchHospital(hospitalId),
  });

  // Specializations for dropdown (v5 syntax)
  const {
    data: specializations = [],
    isLoading: specsLoading,
    error: specsError
  } = useQuery({
    queryKey: ['specializations', hospitalId],
    queryFn: () => fetchSpecializations(hospitalId),
  });

  // Infinite doctors query (v5 syntax)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: doctorsLoading,
    error: doctorsError
  } = useInfiniteQuery({
    queryKey: ['doctors', hospitalId, filter],
    queryFn: ({ pageParam = 1 }) =>
      fetchDoctorsPage({ hospitalId, filter, pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
  });

  // All loaded doctors
  const doctors = data?.pages.flatMap(page => page.data) || [];

  // Main page: first page of doctors
  const limitedDoctors = data?.pages?.[0]?.data || [];

  // Carousel controls
  const [currentImage, setCurrentImage] = useState(0);
  const totalImages = hospital?.images?.length || 0;
  const nextImage = () => setCurrentImage(i => (i + 1) % totalImages);
  const prevImage = () => setCurrentImage(i => (i - 1 + totalImages) % totalImages);

  // Infinite scroll trigger inside modal
  useEffect(() => {
    if (!modalOpen || !hasNextPage) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { rootMargin: '0px', threshold: 1 }
    );
    const el = sentinelRef.current;
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, [modalOpen, hasNextPage, fetchNextPage]);

  if (hospitalLoading || specsLoading || doctorsLoading)
    return <div className="p-6 text-center">Loading...</div>;
  if (hospitalError || specsError || doctorsError)
    return <div className="p-6 text-center text-red-600">Error loading data</div>;

  return (
    <div className="container mx-auto p-6">
      {/* Image carousel */}
      {totalImages > 0 && (
        <div className="relative">
          <img
            src={hospital.images[currentImage]}
            alt={`${hospital.name} image`}
            className="w-full h-64 object-cover rounded-lg"
          />
          {totalImages > 1 && (
            <>
              <button onClick={prevImage} className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white p-2 rounded-full shadow" aria-label="Previous image">
                <ChevronLeft />
              </button>
              <button onClick={nextImage} className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white p-2 rounded-full shadow" aria-label="Next image">
                <ChevronRight />
              </button>
            </>
          )}
        </div>
      )}

      {/* Hospital info */}
      <h1 className="text-2xl font-bold mt-4 text-center">{hospital.name}</h1>
      {hospital.description && <p className="text-gray-600 mt-2">{hospital.description}</p>}

      {/* Specialization filter */}
      <div className="mt-6 text-center ">
        <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Specialization:</label>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="mt-1 block w-60 p-1.5 border border-gray-300 rounded-md mx-auto"
        >
          <option value="">All</option>
          {specializations.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {/* Doctors grid */}
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {limitedDoctors.map(doctor => 
        <li key={doctor._id}>
        <DoctorCard 
        id={doctor._id}
          name={doctor.userId?.name || "Unknown"}
          specialty={doctor.specialization}
          experience={doctor.experience}
          hospital={doctor.hospital?.name || "Unknown Clinic"}
          location={doctor.hospital?.location || "Unknown Location"}
          nextAvailability={"Today, 4 PM"} // Optional dynamic
          consultationFee={doctor.fee}
          profilePicture={
            doctor.userId?.profilePicture ||
            `https://ui-avatars.com/api/?name=${doctor.userId?.name || "Doctor"}&background=random`
          }
          onClick={(id) => console.log("Clicked:", id)} />
          </li>)}
      </ul>

      {/* View All button */}
      {hasNextPage && (
        <div className="mt-6 text-center">
          <button onClick={() => setModalOpen(true)} className="px-6 py-2 bg-blue-600 text-white rounded-md">
            View All Doctors
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto p-6" role="dialog" aria-modal="true">
          <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-2" aria-label="Close modal">
            <X />
          </button>
          <h2 className="text-xl font-bold mb-4">All Doctors</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {doctors.map(doctor => 
            <li key={doctor._id}><DoctorCard 
          name={doctor.user?.name || "Unknown"}
          specialty={doctor.specialization}
          experience={doctor.experience}
          hospital={doctor.hospital?.name || "Unknown Clinic"}
          location={doctor.hospital?.location || "Unknown Location"}
          nextAvailability={"Today, 4 PM"} // Optional dynamic
          consultationFee={doctor.fee}
          profilePicture={
            doctor.userId?.profilePicture ||
            `https://ui-avatars.com/api/?name=${doctor.userId?.name || "Doctor"}&background=random`
          }
          onClick={(id) => console.log("Clicked:", id)}/>
          </li>)}
          </ul>
          {hasNextPage && <div ref={sentinelRef} className="h-1" />}
          {isFetchingNextPage && <div className="text-center mt-4">Loading more...</div>}
        </div>
      )}
    </div>
  );
};

export default HospitalPage;



/*
Concrete flow
Before modal open

modalOpen=false → effect returns immediately → no observer.

After loading page 1

hasNextPage=true but modalOpen=false → still returns → no observer.

User clicks “View All”

modalOpen=true (and hasNextPage=true) → effect runs, creates the observer, and starts watching.

User scrolls down

Sentinel enters view → observer sees entry.isIntersecting===true → calls fetchNextPage().

Final page loaded

React Query sets hasNextPage=false → effect cleanup runs → observer disconnects → infinite‐scroll stops.


Right after React Query finishes loading page 1 (so the very first batch of doctors is in), you’d see something like this:

data.pages[0].data holds your first 6 doctors.
hasNextPage flips to whatever data.pages[0].hasMore is (usually true if there are >6 doctors).
fetchNextPage() is ready to fire off the second page.
isFetchingNextPage remains false until you actually call fetchNextPage().
doctorsLoading goes true during the initial network request, then false once that first page arrives.
doctorsError stays undefined unless something broke.
*/

