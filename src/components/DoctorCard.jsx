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
  const navigate=useNavigate();
  

  const goToDetails = (e) => {
    e.stopPropagation();
    console.log(`Booking appointment with Dr. ${name}`);
    navigate(`/doctor/${id}`)
  };

  return (
    <div
      onClick={goToDetails}
      className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer max-w-sm mx-auto overflow-hidden"
    >
      {/* Top Section */}
      <div className="flex items-center gap-4 p-5 border-b border-gray-100">
        <img
          src={profilePicture}
          alt={`Dr. ${name}`}
          className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
        />
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 truncate">Dr. {name}</h3>
          <p className="text-sm text-blue-600">{specialty}</p>
          <p className="text-xs text-gray-500">{experience} yrs experience</p>
        </div>
      </div>

      {/* Middle Info */}
      <div className="p-5 space-y-3 text-sm text-gray-700">
        <div className="text-sm font-medium text-gray-800">{hospital}</div>

        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{location}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Next:</span>
          <span className="font-medium text-green-600">{nextAvailability}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600">Fee:</span>
          <span className="font-semibold text-gray-900">₹{consultationFee}</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-5 pt-3">
        <button
          onClick={goToDetails}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition duration-200"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;
