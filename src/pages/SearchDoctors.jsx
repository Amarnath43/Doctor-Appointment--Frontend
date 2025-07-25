import React, { useEffect, useState } from 'react'
import NavBar from '../components/NavBar'
import AxiosInstances from '../apiManager'
import DoctorCard from '../components/DoctorCard'
import { Search, Loader } from 'lucide-react'; // Use Loader as a spinner
import { useSearchParams } from 'react-router-dom';
const SearchDoctors = () => {
  const [specializations, setSpecializations] = useState([]);
  const [specialization, setSpecialization] = useState('');
  const [sortBy, setSortBy] = useState('user.name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [doctors, setDoctors] = useState([])
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [readyToFetch, setReadyToFetch] = useState(false);
  const [loading, setLoading] = useState(false); // Trigger this during fetch

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await AxiosInstances.get('/user/all-specializations');
        let allSpecs = response.data.specializations || [];

        const specFromURL = searchParams.get('specialization');

        // Inject specFromURL into options if missing
        if (specFromURL && !allSpecs.includes(specFromURL)) {
          allSpecs = [specFromURL, ...allSpecs];
        }

        setSpecializations(allSpecs);

        if (specFromURL) {
          setSpecialization(specFromURL);
        }


        setReadyToFetch(true); // Now it's safe to fetch doctors
      } catch (err) {
        console.error("Failed to fetch specializations", err);
      }
    };

    fetchSpecializations();
  }, [searchParams]);



  useEffect(() => {
    if (!readyToFetch) return;
    const fetchDoctors = async () => {
      const doctors = await AxiosInstances.get('/user/search-doctors',
        {
          params: {
            keyword: debouncedKeyword,
            specialization,
            sortBy,
            sortOrder,
            page,
            limit: 12
          }
        }
      );

      setDoctors(doctors.data.data)
      console.log(doctors.data.data)
      setPage(doctors.data.page)
    }
    fetchDoctors();
  }, [debouncedKeyword, specialization, sortBy, sortOrder, page, readyToFetch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, specialization, sortBy, sortOrder]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);
    return () => clearTimeout(handler)
  }, [keyword]);


  return (
    <div className='px-4 sm:px-20 py-3'>
      <NavBar />
      <div className="max-w-2xl mx-auto mt-4 p-4 bg-white rounded-xl border border-gray-200">

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search doctors..."
            className="w-full pl-12 pr-4 py-2 rounded-full text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center mt-2">
            <Loader className="animate-spin text-blue-500 w-5 h-5" />
          </div>
        )}

        {/* Toggle Filters on Mobile */}
        <div className="sm:hidden flex justify-end mb-3">
          <button
            className="text-sm text-blue-600 underline"
            onClick={() => setFiltersOpen(!filtersOpen)}
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
              className="w-full rounded-full px-4 py-2 text-sm border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-full px-4 py-2 text-sm border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-full px-4 py-2 text-sm border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSpecialization(e.target.value === 'all' ? '' : e.target.value)}
              value={specialization || 'all'}
            >
              <option value="all">All</option>
              {specializations.map((spec, idx) => (
                <option key={idx} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* When Loading */}
      {loading ? (
        <div className="flex justify-center items-center mt-6">
          <Loader className="animate-spin text-blue-500 w-5 h-5" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center text-gray-600 mt-6">
          No doctors found. Try adjusting your filters or keyword.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {doctors.map((doctor) => (
            <li key={doctor._id}>
              <DoctorCard
                id={doctor._id}
                name={doctor.user?.name || "Unknown"}
                specialty={doctor.specialization}
                experience={doctor.experience}
                hospital={doctor.hospital?.name || "Unknown Clinic"}
                location={doctor.hospital?.location || "Unknown Location"}
                nextAvailability={"Today, 4 PM"} // Optional dynamic
                consultationFee={doctor.fee}
                profilePicture={
                  doctor.user?.profilePicture ||
                  `https://ui-avatars.com/api/?name=${doctor.user?.name || "Doctor"}&background=random`
                }
                onClick={(id) => console.log("Clicked:", id)}
              />
            </li>
          ))}
        </ul>
      )}









    </div>
  )
}

export default SearchDoctors

/*
Step-by-Step Example
Let’s say keyword changes from "a" → "ab" → "abc":

1. On "a":
setTimeout is created → will trigger in 500ms.

handler holds the timer ID.

2. On "ab":
Before setting a new timeout, React calls the cleanup function from the previous effect:

js
Copy
Edit
return () => clearTimeout(handler);
→ This clears the timeout for "a"!

Then it sets a new timeout for "ab".

3. On "abc":
React again runs cleanup → clears timeout for "ab".

New timeout set for "abc".

4. After 500ms of no change:
No more cleanup needed.

Timeout for "abc" completes → setDebouncedKeyword("abc") runs.

📦 Why This Works
JavaScript’s setTimeout returns an ID (handler), which clearTimeout(handler) uses to cancel it.

React’s useEffect ensures:

Old timers are cancelled before setting new ones.

Only the latest input gets processed after delay.
*/
