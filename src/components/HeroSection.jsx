import React from 'react'
import { FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <div className=' bg-blue-500 mt-4 rounded-md  text-white md:px-15 px-8 pt-4  '>
      <div className='flex md:flex-row flex-col items-center md:gap-0 gap-2 '>
        <div className='md:w-1/2 w-full text-center md:text-left'>
          <div className='lg:text-4xl font-bold md:text-2xl text-xl'>Book Appointment <br />With Trusted Doctors </div>
          <p className='my-4 md:text-md text-sm '>Click on Book Appointment button below to browse extensive list of trusted doctors, schedule your appointment hassle-free</p>

          <div className="flex justify-center md:justify-start">
            <button
              className='flex items-center gap-1.5 bg-white text-black px-4 py-1.5 rounded-3xl'
              onClick={() => navigate('/search-doctors')}
            >
              <span className='lg:text-lg text-sm'>Book Appointment</span>
              <FaArrowRight />
            </button>
          </div>



        </div>
        <div className='md:w-1/2 w-full'>
          <img src="doctors_herosection.png" className='w-full' alt="Male and female doctor in hero section" />
        </div>
      </div>
    </div>
  )
}

export default HeroSection
