import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-700 mt-4">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6 md:grid-cols-3">
        {/* Branding */}
        <div>
          <h2 className="text-xl font-bold text-blue-700 mb-2">QuickMediLink</h2>
          <p className="text-sm text-gray-600">
            Bridging patients and doctors with trust. Book appointments, manage visits, and find care — fast.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="font-semibold mb-2">Quick Links</h3>
          <ul className="text-sm space-y-1">
            <li><a href="/" className="hover:underline">Home</a></li>
            <li><a href="/doctors" className="hover:underline">Find Doctors</a></li>
            <li><a href="/hospitals" className="hover:underline">Find Hospitals</a></li>
            <li><a href="/about" className="hover:underline">About Us</a></li>
          </ul>
        </div>

        {/* Social + Contact */}
        <div>
          <h3 className="font-semibold mb-2">Connect With Us</h3>
          <div className="flex gap-4 mb-2">
            <a href="#" className="hover:text-blue-500"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="hover:text-pink-500"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="hover:text-blue-400"><Twitter className="w-5 h-5" /></a>
          </div>
          <p className="text-sm text-gray-600">Email: support@quickmedilink.com</p>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 border-t py-4">
        &copy; {new Date().getFullYear()} QuickMediLink. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
