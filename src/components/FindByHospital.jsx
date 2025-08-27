// src/components/FindByHospital.jsx
import React, { useState, useEffect } from 'react';
import HospitalCard from './hospital/HospitalCard';
import HospitalCardSkeleton from './hospital/HospitalCardSkeleton';
import AxiosInstances from '../apiManager';
import { useNavigate } from 'react-router-dom';

const SKELETON_COUNT = 3;

const FindByHospital = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await AxiosInstances.get('/user/hospitals', { params: { limit: 3 } });
        if (!cancelled) setHospitals(res.data?.data ?? []);
      } catch {
        if (!cancelled) setHospitals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="text-center mt-4">
      <div className="md:text-3xl text-2xl font-semibold mb-5">Find by Hospital</div>
      <p className="mb-2 text-sm font-light max-w-[400px] mx-auto">
        Browse extensive list of trusted doctors as per hospital, schedule your appointment hassle-free
      </p>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6" aria-live="polite">
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
              <li key={`skeleton-${idx}`}>
                <HospitalCardSkeleton />
              </li>
            ))
          : hospitals.map((h) => (
              <li key={h._id}>
                <HospitalCard
                  id={h._id}
                  name={h.name}
                  location={h.location}
                  imageUrl={h.imageUrl}
                  doctorCount={h.doctorCount}
                />
              </li>
            ))}
      </ul>

      <div className="flex justify-center mt-6 px-4">
        <button
          onClick={() => navigate('/hospitals')}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-200 text-sm"
        >
          View All Hospitals
        </button>
      </div>
    </div>
  );
};

export default FindByHospital;
