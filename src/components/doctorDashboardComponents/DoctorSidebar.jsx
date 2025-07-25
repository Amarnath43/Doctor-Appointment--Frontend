
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, Calendar, History, User, Menu, X } from 'lucide-react';

const DoctorSidebar = ({ isOpen, setIsOpen }) => {
  
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      isActive 
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]' 
        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-[1.01]'
    }`;

  return (
    <>
      

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-white shadow-2xl h-screen w-72
          fixed top-0 left-0 z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:translate-x-0 lg:block lg:shadow-xl
          border-r border-gray-100
        `}
      >
        {/* ... keep existing code (header section with close button and title) */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          {/* Close Button (Mobile Only) */}
          <div className="flex justify-end lg:hidden mb-4">
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Doctor Panel</h2>
              <p className="text-sm text-gray-600">Healthcare Dashboard</p>
            </div>
          </div>
        </div>

        {/* ... keep existing code (navigation section) */}
        <nav className="p-6 space-y-3">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Main Menu
            </h3>
            <div className="space-y-2">
              <NavLink to="analytics" className={linkClass}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors duration-200">
                  <BarChart2 size={18} />
                </div>
                <span className="font-medium">Analytics</span>
              </NavLink>
              
              <NavLink to="slots" className={linkClass}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 group-hover:from-green-200 group-hover:to-emerald-200 transition-colors duration-200">
                  <Calendar size={18} />
                </div>
                <span className="font-medium">Set Slots</span>
              </NavLink>
              
              <NavLink to="history" className={linkClass}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 group-hover:from-purple-200 group-hover:to-violet-200 transition-colors duration-200">
                  <History size={18} />
                </div>
                <span className="font-medium">Appointment History</span>
              </NavLink>
              
              <NavLink to="profile" className={linkClass}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 group-hover:from-orange-200 group-hover:to-amber-200 transition-colors duration-200">
                  <User size={18} />
                </div>
                <span className="font-medium">Edit Profile</span>
              </NavLink>
            </div>
          </div>
        </nav>

        {/* ... keep existing code (footer section) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2024 Healthcare System
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DoctorSidebar;
