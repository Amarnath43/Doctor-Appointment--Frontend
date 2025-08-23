import React from 'react';
import { Outlet } from 'react-router-dom';
import DoctorSidebar from '../components/doctorDashboardComponents/DoctorSidebar';
import DashboardNavbar from '../components/DashboardNavbar';
import { useState } from 'react';
const DoctorDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <DoctorSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <DashboardNavbar onSidebarToggle={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardLayout;
