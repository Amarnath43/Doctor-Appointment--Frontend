import React from 'react';
import { MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HospitalCard = ({ id, name, imageUrl, location, doctorCount }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
     hover:shadow-md transition-all duration-200 p-5 text-center flex flex-col
     items-center w-full h-full">
      
      {/* Image */}
      <img
        src={imageUrl ? imageUrl : '/default-hospital.png'}
        alt={name}
        className="w-70 h-40 rounded-md  object-cover border-2 border-blue-100 mb-3"
      />

      {/* Name */}
      <h3 className="text-lg font-semibold text-gray-800">{name}</h3>

      {/* Location */}
      <div className="flex items-center text-sm text-gray-500 mt-1">
        <MapPin size={16} className="mr-1 text-gray-400" />
        <span>{location}</span>
      </div>

      {/* Doctor Count */}
      <div className="flex items-center text-sm text-gray-500 mt-1">
        <Users size={16} className="mr-1 text-gray-400" />
        <span>{doctorCount} {doctorCount>1?"Doctors":"Doctor"}</span>
      </div>

      {/* Button */}
      <button
        onClick={() => navigate(`/hospitals/${id}`)}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition-all duration-200"
      >
        View Doctors
      </button>
    </div>
  );
};

export default HospitalCard;
