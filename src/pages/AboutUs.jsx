import React from 'react';
import { CalendarCheck, HeartPulse, Handshake } from 'lucide-react';
import NavBar from '../components/NavBar';

const AboutUs = () => {
  return (
    <section className='px-4 sm:px-20 py-3'>
        <NavBar/>
     <div className="bg-white py-8 px-5 sm:px-10 lg:px-20">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
          About <span className="text-blue-600">QuickMediLink</span>
        </h2>

        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
          QuickMediLink is a modern doctor appointment app built to simplify healthcare access. 
          We understand that in today's fast-paced world, waiting for hours or juggling calls just to see a doctor can be frustrating. 
          Our platform is designed to take that stress away — so you can book the care you need, when you need it, in just a few taps.
        </p>

        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-10">
          Whether you're managing a busy schedule, helping your family find care, or just trying to avoid long waiting lines, 
          QuickMediLink puts convenience, trust, and simplicity at the center of your healthcare journey.
        </p>

        <div className="grid gap-6 sm:grid-cols-3 text-left">
          {/* Feature 1 */}
          <div className="p-5 border rounded-xl shadow-sm hover:shadow-md transition-all">
            <CalendarCheck className="text-blue-500 mb-4 w-6 h-6" />
            <h4 className="font-semibold text-gray-800 mb-2 text-lg">Book in Seconds</h4>
            <p className="text-sm text-gray-600">
              Easily browse doctors and book appointments online. No calls, no delays.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 border rounded-xl shadow-sm hover:shadow-md transition-all">
            <HeartPulse className="text-pink-500 mb-4 w-6 h-6" />
            <h4 className="font-semibold text-gray-800 mb-2 text-lg">Healthcare, Simplified</h4>
            <p className="text-sm text-gray-600">
              Designed to be fast, clean, and easy — even for first-time users.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 border rounded-xl shadow-sm hover:shadow-md transition-all">
            <Handshake className="text-green-500 mb-4 w-6 h-6" />
            <h4 className="font-semibold text-gray-800 mb-2 text-lg">Trust at Core</h4>
            <p className="text-sm text-gray-600">
              We connect you with verified doctors you can rely on — every time.
            </p>
          </div>
        </div>

        <p className="mt-10 text-gray-700 text-sm sm:text-base max-w-xl mx-auto">
          <span className="font-semibold text-blue-600">Our mission:</span> 
          To make healthcare access as simple and stress-free as possible — starting with appointments.
        </p>
      </div>
    </div>
    </section>
  );
};

export default AboutUs;
