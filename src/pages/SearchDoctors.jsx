// SearchDoctors.jsx
import React, { useEffect, useMemo, useState } from 'react';
import NavBar from '../components/NavBar';
import AxiosInstances from '../apiManager';
import DoctorCard from '../components/DoctorCard';
import { Search, Loader, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { makePublicUrlFromKey } from '../utils/s3PublicUrl';

const PAGE_SIZE = 6;

const SearchDoctors = () => {
  const [specializations, setSpecializations] = useState([]);
  const [specialization, setSpecialization] = useState('');
  const [sortBy, setSortBy] = useState('user.name'); // 'user.name' | 'fee'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [totalCount, setTotalCount] = useState(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [readyToFetch, setReadyToFetch] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [hasFetched, setHasFetched] = useState(false);

  // Debounce keyword
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 500);
    return () => clearTimeout(t);
  }, [keyword]);

  // Fetch specializations (and preselect from URL)
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const response = await AxiosInstances.get('/user/all-specializations');
        let allSpecs = response?.data?.specializations || [];
        const specFromURL = searchParams.get('specialization');

        if (specFromURL && !allSpecs.includes(specFromURL)) {
          allSpecs = [specFromURL, ...allSpecs];
        }

        if (!aborted) {
          setSpecializations(allSpecs);
          if (specFromURL) setSpecialization(specFromURL);
          setReadyToFetch(true);
        }
      } catch (err) {
        if (!aborted) {
          setSpecializations([]);
          setReadyToFetch(true); // still allow searching
          console.error('Failed to fetch specializations', err);
        }
      }
    })();
    return () => {
      aborted = true;
    };
  }, [searchParams]);

  // Reset pagination when inputs change
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, specialization, sortBy, sortOrder]);

  // Fetch doctors
  useEffect(() => {
    if (!readyToFetch) return;
    let didCancel = false;

    const controller = new AbortController();
    setLoading(true);
    setErrorMsg(null);

    const params = {
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortOrder,
    };
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    if (specialization) params.specialization = specialization;

    (async () => {
      try {
        const res = await AxiosInstances.get('/user/search-doctors', {
          params,
          signal: controller.signal,
        });

        const data = res?.data?.data ?? [];
        const metaPage = res?.data?.page ?? page;
        const metaTotalPages = res?.data?.totalPages ?? null;
        const metaTotalCount = res?.data?.total ?? null;

        setDoctors(data);
        setPage(metaPage);
        setTotalPages(metaTotalPages);
        setTotalCount(metaTotalCount);
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          // ignore canceled
        } else {
          console.error('Failed to fetch doctors', err);
          setDoctors([]);
          setTotalPages(0);
          setErrorMsg('Something went wrong while fetching doctors.');
        }
      } finally {
        if (!didCancel) {
          setHasFetched(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
      didCancel = true;
    }
  }, [debouncedKeyword, specialization, sortBy, sortOrder, page, readyToFetch]);

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(
    () => (totalPages ? page < totalPages : doctors.length === PAGE_SIZE),
    [page, totalPages, doctors.length]
  );

  return (
    <div className="px-4 sm:px-20 py-3">
      <NavBar />

      <div className="max-w-2xl mx-auto mt-4 p-3 bg-white rounded-xl border border-gray-200">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search doctors..."
            className="w-full pl-12 pr-10 py-2 rounded-full text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {loading && (
            <Loader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500 w-4 h-4" />
          )}
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="text-sm">{errorMsg}</div>
          </div>
        )}

        {/* Toggle Filters on Mobile */}
        <div className="sm:hidden flex justify-end mb-3">
          <button
            className="text-sm text-blue-600 underline"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters Grid */}
        <div className={`grid gap-3 sm:grid-cols-3 ${filtersOpen ? 'grid-cols-1' : 'hidden sm:grid'}`}>
          {/* Sort By */}
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">Sort by</label>
            <select
              className="w-full rounded-full px-3 py-1.5 text-sm border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSortBy(e.target.value)}
              value={sortBy}
            >
              <option value="user.name">Name</option>
              <option value="fee">Fee</option>
            </select>
          </div>

          {/* Order */}
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">Order</label>
            <select
              className="w-full rounded-full px-3 py-1.5 text-sm border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSortOrder(e.target.value)}
              value={sortOrder}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">Specialization</label>
            <select
              className="w-full rounded-full px-3 py-1.5 text-sm border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSpecialization(e.target.value === 'all' ? '' : e.target.value)}
              value={specialization || 'all'}
            >
              <option value="all">All</option>
              {specializations.map((spec, idx) => (
                <option key={`${spec}-${idx}`} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results / Empty / Loading */}
      {!hasFetched ? (
        // first load: show spinner while bootstrapping
        <div className="flex justify-center items-center mt-6">
          <Loader className="animate-spin text-blue-500 w-6 h-6" />
        </div>
      ) : loading && doctors.length === 0 ? (
        <div className="flex justify-center items-center mt-6">
          <Loader className="animate-spin text-blue-500 w-6 h-6" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center text-gray-600 mt-6">
          {errorMsg ? 'Please try again.' : 'No doctors found. Try adjusting your filters or keyword.'}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {doctors.map((doctor) => (
              <li key={doctor._id}>
                <DoctorCard
                  id={doctor._id}
                  name={doctor.user?.name || 'Unknown'}
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
                    makePublicUrlFromKey(doctor.user?.profilePicture) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.user?.name || 'Doctor')}&background=random`
                  }
                  onClick={(id) => console.log('Clicked:', id)}
                />
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 text-sm disabled:opacity-50"
              disabled={!canPrev || loading}
              onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            <div className="text-sm text-gray-600">
              Page <span className="font-medium">{page}</span>
              {totalPages ? <> of <span className="font-medium">{totalPages}</span></> : null}
              {typeof totalCount === 'number' ? (
                <> · <span className="font-medium">{totalCount}</span> results</>
              ) : null}
            </div>

            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 text-sm disabled:opacity-50"
              disabled={!canNext || loading}
              onClick={() => canNext && setPage((p) => p + 1)}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchDoctors;
