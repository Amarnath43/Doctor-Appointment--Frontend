import React from 'react';
import {
  Mail, Phone, MapPin, Clock, Facebook, Twitter, Instagram
} from 'lucide-react';
import NavBar from '../components/NavBar';

const ContactPage = () => {
  return (
    <section className='px-4 sm:px-20 py-3'>
        <NavBar/>
    <div className="bg-white py-14 px-5 sm:px-10 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center mb-8">
          Contact <span className="text-blue-600">QuickMediLink</span>
        </h2>

        {/* Contact Info */}
        <div className="grid sm:grid-cols-2 gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="text-blue-600 w-5 h-5 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Email</p>
                <p className="text-sm text-gray-600">support@quickmedilink.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="text-blue-600 w-5 h-5 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Phone</p>
                <p className="text-sm text-gray-600">+91 98765 43210</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-blue-600 w-5 h-5 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Address</p>
                <p className="text-sm text-gray-600">123 Health Street, Bengaluru, India</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="text-blue-600 w-5 h-5 mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Hours</p>
                <p className="text-sm text-gray-600">Mon–Sat: 9:00 AM – 8:00 PM</p>
              </div>
            </div>
            {/* Social icons */}
            <div className="flex gap-4 pt-3">
              <Facebook className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer" />
              <Twitter className="w-5 h-5 text-gray-500 hover:text-blue-400 cursor-pointer" />
              <Instagram className="w-5 h-5 text-gray-500 hover:text-pink-500 cursor-pointer" />
            </div>
          </div>

          {/* Contact Form */}
          <form className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Your Name" className="w-full border px-4 py-2 rounded-md text-sm" />
              <input type="email" placeholder="Email Address" className="w-full border px-4 py-2 rounded-md text-sm" />
            </div>
            <input type="text" placeholder="Phone Number" className="w-full border px-4 py-2 rounded-md text-sm" />
            <input type="text" placeholder="Subject" className="w-full border px-4 py-2 rounded-md text-sm" />
            <textarea placeholder="Your Message" rows={4} className="w-full border px-4 py-2 rounded-md text-sm resize-none" />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
    </section>
  );
};

export default ContactPage;
