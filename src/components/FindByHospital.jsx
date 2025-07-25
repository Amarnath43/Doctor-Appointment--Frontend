import React from 'react'
import { useState, useEffect } from 'react'
import HospitalCard from './hospital/HospitalCard'
import AxiosInstances from '../apiManager'
import { Navigate, useNavigate } from 'react-router-dom'
const FindByHospital = () => {
  const [hospitals, setHospitals] = useState();
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHomepageHospitals = async () => {
      const res = await AxiosInstances.get('/user/hospitals', { params: { limit: 3 } });
      setHospitals(res.data.data);
      console.log(res.data.data)

    };
    fetchHomepageHospitals();
  }, [])
  return (<div className='text-center mt-4'>
    <div className='md:text-3xl text-2xl font-semibold mb-5 '>Find by Hospital</div>
    <p className='mb-2 text-sm font-light max-w-[400px] mx-auto'>Browse extensive list of trusted doctors as per hospital, schedule your appointment hassle-free</p>
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
      {
        hospitals?.map((hospital) => (
          <li key={hospital._id}>
            <HospitalCard
              id={hospital._id}
              name={hospital.name}
              location={hospital.location}
              imageUrl={hospital.imageUrl}
              doctorCount={hospital.doctorCount}
            />
          </li>
        ))
      }
    </ul>
    <div className="flex justify-center mt-6 px-4">
      <button
        onClick={() => navigate('/hospitals')}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-200 text-sm "
      >
        View All Hospitals
      </button>
    </div>


  </div>
  )
}

export default FindByHospital
