import React from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';



const HeroSection = () => {
  const navigate = useNavigate();

  return (
    // Main container: relative, rounded, and overflow-hidden are key
    <div className="relative mt-4 rounded-xl overflow-hidden text-white">
      
      {/* 1. Background Image */}
      {/* Sits at the bottom of the stack (absolute) and covers the area */}
      <img
        src="hero.png"
        alt="Two doctors smiling in a hospital hallway"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 2. Gradient Overlay */}
      {/* Sits on top of the image but behind the text.
        On mobile: A gradient from the bottom up to ensure text is readable.
        On desktop: A gradient from the right, fading to transparent on the left.
        This darkens the "negative space" area for your text to pop.
      */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-blue-700/90 via-blue-700/70 to-transparent 
                   md:bg-gradient-to-r md:from-transparent md:via-blue-700/60 md:to-blue-800"
        aria-hidden="true"
      ></div>

      {/* 3. Content */}
      {/* Sits on top (relative).
        Uses padding for spacing.
        On desktop, it's pushed to the right half using md:ml-auto and md:w-1/2.
      */}
      <div className="relative z-10 flex flex-col p-8 md:p-16 lg:p-20 md:w-2/3 lg:w-1/2 md:ml-auto">
        <span className="block mb-2 text-sm font-semibold uppercase tracking-wider text-gray-100">
          Welcome to QuickMediLink
        </span>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 drop-shadow-md">
          Book Appointment <br />
          With Trusted Doctors
        </h1>
        
        <p className="text-base lg:text-lg text-blue-100 mb-8 max-w-lg">
          Browse our extensive list of trusted specialists and schedule your appointment hassle-free.
        </p>

        <div className="flex">
          <button
            className="flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-full 
                       font-bold shadow-lg 
                       transform transition-all duration-300 ease-in-out
                       hover:bg-gray-100 hover:scale-105 
                       focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-75"
            onClick={() => navigate('/search-doctors')}
          >
            <span>Book Appointment</span>
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;