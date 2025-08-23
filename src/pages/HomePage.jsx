import React from 'react'
import NavBar from '../components/NavBar'
import HeroSection from '../components/HeroSection'
import FindBySpeciality from '../components/FindBySpeciality'
import FindByHospital from '../components/FindByHospital'
import { Star,Stethoscope } from 'lucide-react';
import Footer from '../components/Footer'
import { Navigate, useNavigate } from 'react-router-dom'

const testimonials = [
  {
    name: 'Priya R.',
    comment: 'QuickMediLink made it super easy to book my appointment. The doctors were professional and helpful!',
    designation: 'Patient, Hyderabad',
    rating: 5
  },
  {
    name: 'Rohit K.',
    comment: 'Very smooth experience. Found a specialist near me and got treated within a day.',
    designation: 'Patient, Pune',
    rating: 4
  },
  {
    name: 'Dr. Meera S.',
    comment: 'As a doctor, I find QuickMediLink well-designed and easy to manage appointments.',
    designation: 'Dermatologist, Bangalore',
    rating: 5
  }
];
const HomePage = () => {
  const StarRating = ({ rating }) => {
  return (
    <div className="flex text-yellow-500">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-500' : 'text-gray-300'}`} />
      ))}
    </div>
  );
};

const navigate=useNavigate();
  return (
    <div className='px-4 sm:px-20 pt-3 '>
      <NavBar/>
      <HeroSection/>
      <FindBySpeciality/>
      <FindByHospital/>
       <div className="py-12 px-4 max-w-4xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-2">What Our Users Say</h2>
      <p className="text-gray-500 mb-8">Trusted by patients and doctors across India</p>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="bg-white shadow-md rounded-xl p-4 text-left border hover:shadow-lg transition duration-300"
          >
            <p className="text-gray-700 mb-4">“{t.comment}”</p>
            <div className="font-semibold text-blue-700">{t.name}</div>
            <div className="text-sm text-gray-500">{t.designation}</div>
            <StarRating rating={t.rating} />
          </div>
        ))}
      </div>
      
    </div>
    <div className="relative isolate bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-2xl shadow-lg border border-blue-200 overflow-hidden px-6 py-10">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="bg-blue-100 rounded-full p-3">
          <Stethoscope className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Are You a Doctor?</h2>
        <p className="text-sm text-gray-600 max-w-lg">
          Join <span className="font-semibold text-blue-700">QuickMediLink</span> and connect with thousands of patients across India. Manage appointments, grow your visibility, and build a trusted digital presence.
        </p>
        <button
          onClick={()=>navigate('/doctor/register')}
          className="inline-block mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full shadow transition-transform transform hover:scale-105"
        >
          Register as Doctor
        </button>
      </div>
    </div>
    <Footer/>

    </div>
  )
}

export default HomePage
