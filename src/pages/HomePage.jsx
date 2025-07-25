import React from 'react'
import NavBar from '../components/NavBar'
import HeroSection from '../components/HeroSection'
import FindBySpeciality from '../components/FindBySpeciality'
import FindByHospital from '../components/FindByHospital'

const HomePage = () => {
  return (
    <div className='px-4 sm:px-20 py-3 '>
      <NavBar/>
      <HeroSection/>
      <FindBySpeciality/>
      <FindByHospital/>
    </div>
  )
}

export default HomePage
