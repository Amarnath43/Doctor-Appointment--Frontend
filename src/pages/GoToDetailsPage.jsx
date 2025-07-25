import React from 'react'
import NavBar from '../components/NavBar'
import DoctorDetails from '../components/DoctorDetails'

const GoToDetailsPage = () => {
  return (
    <div className='px-4 sm:px-20 py-3'>
      <NavBar/>
      <DoctorDetails/>
    </div>
  )
}

export default GoToDetailsPage
