import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  User,
  CalendarCheck,
  Clock,
  X,
  Menu,
  History,
  XCircle,
  ChevronDown,
  ChevronRight,
  Home
} from 'lucide-react';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true); // Controls collapse

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-2 py-3 rounded-lg transition-all duration-200 group ${
      isActive
        ? ' shadow transform scale-[1.02]'
        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-[1.01] font-medium'
    }`;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

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
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-end lg:hidden mb-4">
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Patient Panel</h2>
              <p className="text-sm text-gray-600">Healthcare Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Main Menu
          </h3>
          {/* Home */}
          <div className="mt-6 " onClick={() => setIsOpen(false)}>
            <NavLink to="/admin/dashboard/analytics" className={linkClass}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center ">
                <Home size={18} />
              </div>
              Dashboard
            </NavLink>
          </div>
         

          {/* Profile */}
          <div className="" onClick={() => setIsOpen(false)}>
            <NavLink to="/admin/dashboard/manage-entities" className={linkClass}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
                <User size={18} />
              </div>
              Pending Doctors/Hospitals
            </NavLink>
          </div>

          <div className="" onClick={() => setIsOpen(false)}>
            <NavLink to="/admin/dashboard/allusers" className={linkClass}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
                <User size={18} />
              </div>
              All Users
            </NavLink>
          </div>

          <div className="" onClick={() => setIsOpen(false)}>
            <NavLink to="/admin/dashboard/hospital-list" className={linkClass}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
                <User size={18} />
              </div>
              Add/Update Hospital
            </NavLink>
          </div>

          <div className="" onClick={() => setIsOpen(false)}>
            <NavLink to="/admin/dashboard/appointment-history" className={linkClass}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
                <User size={18} />
              </div>
              Appointment History
            </NavLink>
          </div>
          
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
          <p className="text-xs text-gray-500 text-center">© 2024 Healthcare System</p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
