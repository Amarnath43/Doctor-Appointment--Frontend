import React from 'react';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

const DoctorCard = ({
  id,
  name,
  specialty,
  experience,
  hospital,
  location,
  nextAvailability,
  consultationFee,
  profilePicture,
  onClick
}) => {
  const navigate = useNavigate();
  
  const goToDetails = (e) => {
    e.stopPropagation();
    console.log(`Booking appointment with Dr. ${name}`);
    navigate(`/doctor/${id}`)
  };

  return (
    <div
      onClick={goToDetails}
      className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer max-w-sm mx-auto overflow-hidden"
    >
      {/* Header with Doctor Info */}
      <div className="flex items-center gap-3 p-3">
        <img
          src={profilePicture}
          alt={`Dr. ${name}`}
          className="w-14 h-14 rounded-full object-cover border-2 border-blue-200"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-800 truncate">Dr. {name}</h3>
          <p className="text-sm text-blue-600">{specialty}</p>
          <p className="text-xs text-gray-500">{experience} yrs • {hospital}</p>
        </div>
      </div>

      {/* Compact Info Grid */}
      <div className="px-4 pb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-green-500" />
            <span className="text-green-600 font-medium">{nextAvailability}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-gray-900">₹{consultationFee}</span>
          </div>
        </div>

        <button
          onClick={goToDetails}
          className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition duration-200"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;