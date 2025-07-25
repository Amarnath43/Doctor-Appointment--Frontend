import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstances from '../apiManager';
import NavBar from '../components/NavBar';
import HospitalCard from '../components/hospital/HospitalCard';

const HospitalsPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await AxiosInstances.get('/user/hospitals', {
          params: { page, limit: 10 },
        });
        console.log(res.data.data)
        setHospitals(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error('Error fetching hospitals:', err);
        setError('Failed to fetch hospital data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [page]);

  const goToPage = (pageNum) => {
    setSearchParams({ page: pageNum });
  };

  return (
    <div className="px-4 sm:px-20 py-4">
      <NavBar />

      {/* Heading and Description */}
      <div className="text-center my-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Explore Hospitals</h1>
        <p className="text-sm text-gray-600 mt-2">
          Discover trusted hospitals and browse their list of qualified doctors.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-blue-500 font-medium mt-6">
          Loading hospitals...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-500 font-medium mt-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && hospitals.length === 0 && (
        <div className="text-center text-gray-500 mt-6">
          No hospitals found.
        </div>
      )}

      {/* Hospital Grid */}
      {!loading && !error && hospitals.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {
            hospitals.map((hospital) => (
              <HospitalCard
                key={hospital._id}
                id={hospital._id}
                name={hospital.name}
                imageUrl={hospital.imageUrl}
                location={hospital.location}
                doctorCount={hospital.doctorCount}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8 flex-wrap gap-2">
            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {page < totalPages && (
              <button
                onClick={() => goToPage(page + 1)}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Next
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HospitalsPage;
