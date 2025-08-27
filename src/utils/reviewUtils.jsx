import React from 'react';
import { Star } from 'lucide-react';

export const renderStars = (rating, size = 'sm') => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const val = Number(rating) || 0;
  const fullStars = Math.floor(val);
  const percent = (val - fullStars) * 100;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => {
        const isFull = i < fullStars;
        const isFractional = i === fullStars && percent > 0;

        const maskId = `mask-stars-${Math.random().toString(36).substring(2, 9)}`;

        return (
          <svg
            key={i}
            className={`${sizeClass}`}
            viewBox="0 0 24 24"
          >
            {/* The base empty star */}
            <path
              className="text-gray-300"
              fill="currentColor"
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />

            {/* The filled star, clipped by a mask */}
            {isFull || isFractional ? (
              <path
                className="text-yellow-400"
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                style={isFractional ? {
                  mask: `url(#${maskId})`,
                  WebkitMaskImage: `url(#${maskId})`
                } : {}}
              />
            ) : null}

            {/* Mask definition for the fractional fill */}
            {isFractional && (
              <mask id={maskId}>
                <rect x="0" y="0" width={`${percent}%`} height="100%" fill="white" />
              </mask>
            )}
          </svg>
        );
      })}
    </div>
  );
};