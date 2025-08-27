// src/components/hospital/HospitalCard.jsx
import React from 'react';
import { MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const cardBase =
  "bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 text-center flex flex-col items-center w-full h-full";

const HospitalCard = ({ id, name, imageUrl, location, doctorCount }) => {
  const href = `/hospitals/${id}`;
  const fallback = '/default-hospital.png';

  return (
    <div className={cardBase}>
      {/* Image wrapper keeps exact height before image loads */}
      <Link to={href} className="block w-full">
        <div className="w-full aspect-[16/9] rounded-md overflow-hidden border-2 border-blue-100 mb-3">
          <img
            src={imageUrl || fallback}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallback;
            }}
            alt={name}
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover block"
          />
        </div>
      </Link>

      {/* Name (single-line to keep height stable) */}
      <h3 className="text-lg font-semibold text-gray-800 w-full truncate leading-7">{name}</h3>

      {/* Location */}
      <div className="flex items-center text-sm leading-5 text-gray-500 mt-1 w-full justify-center">
        <MapPin size={16} className="mr-1 text-gray-400 shrink-0" />
        <span className="truncate">{location}</span>
      </div>

      {/* Doctor Count */}
      <div className="flex items-center text-sm leading-5 text-gray-500 mt-1">
        <Users size={16} className="mr-1 text-gray-400" />
        <span>
          {doctorCount} {doctorCount > 1 ? 'Doctors' : 'Doctor'}
        </span>
      </div>

      {/* Button (fixed height via py-2 + rounded) */}
      <Link
        to={href}
        className="mt-4 w-full inline-block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm leading-5 font-medium py-2 rounded-xl transition-all duration-200"
      >
        View Doctors
      </Link>
    </div>
  );
};

export default HospitalCard;
export { cardBase }; // export base so the skeleton reuses *exact* styles
