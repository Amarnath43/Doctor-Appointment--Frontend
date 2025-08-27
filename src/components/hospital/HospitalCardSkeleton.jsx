// src/components/hospital/HospitalCardSkeleton.jsx
import React from 'react';
import { cardBase } from './HospitalCard';

const HospitalCardSkeleton = () => {
  return (
    <div className={`${cardBase} animate-pulse`}>
      {/* Image placeholder: same wrapper ensures identical height */}
      <div className="w-full aspect-[16/9] rounded-md overflow-hidden border-2 border-blue-100 mb-3">
        <div className="w-full h-full bg-gray-200" />
      </div>

      {/* Title line: text-lg has ~1.75rem line-height -> use h-7 */}
      <div className="w-full">
        <div className="h-7 bg-gray-200 rounded w-3/4 mx-auto" />
      </div>

      {/* Location line: text-sm ~1.25rem -> h-5 */}
      <div className="h-5 bg-gray-100 rounded w-1/2 mt-1 mx-auto" />

      {/* Doctor count line: text-sm -> h-5 */}
      <div className="h-5 bg-gray-100 rounded w-1/3 mt-1 mx-auto" />

      {/* Button placeholder: approx h-10 (py-2 + line height) */}
      <div className="mt-4 h-9 w-full rounded-xl bg-gray-200" />
    </div>
  );
};
//mt-4 w-full inline-block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition-all duration-200
export default HospitalCardSkeleton;
