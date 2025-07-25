import React from 'react'
import { specializations } from '../data/specializationobj'
import {useNavigate } from 'react-router-dom';

const FindBySpeciality = () => {
    const navigate=useNavigate();
     
  const handleSearchDoctorsClick = ({
    keyword = '',
    specialization = '',
    sortBy = 'user.name',
    sortOrder = 'asc',
    page = 1,
    limit = 10
  }) => {
    const queryString = new URLSearchParams({
      keyword,
      specialization,
      sortBy,
      sortOrder,
      page: page.toString(),
      limit: limit.toString()
    }).toString();

    navigate(`/search-doctors?${queryString}`);
  };
    return (
        <div className='py-10'>
        <div className='text-center'>
            
            <div className='md:text-3xl text-2xl font-semibold mb-5 '>Find by Speciality</div>
            <p className='mb-2 text-sm font-light max-w-[400px] mx-auto'>Browse extensive list of trusted doctors as per specialization, schedule your appointment hassle-free</p>
            <div className='flex md:gap-3 md:justify-center justify-start overflow-x-auto whitespace-nowrap scrollbar-hidden mt-6'>
                {
                    specializations.map((specialization) => (
                        <div key={specialization.id} className='flex flex-col items-center min-w-[90px]'>
                            <img src={specialization.icon} alt={specialization.name} className='md:min-w-[100px] w-[60px]' onClick={() => handleSearchDoctorsClick({
    specialization: specialization.name,
  })}/>
                            <div className='text-center font-normal text-[0.70rem] '>{specialization.name}</div>
                        </div>
                    ))
                }
            </div>
            </div>
            </div>
        
    )
}

export default FindBySpeciality
