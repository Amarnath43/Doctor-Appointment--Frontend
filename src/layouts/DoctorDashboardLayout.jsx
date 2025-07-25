import React from 'react';
import { Outlet } from 'react-router-dom';
import DoctorSidebar from '../components/doctorDashboardComponents/DoctorSidebar';
import DashboardNavbar from '../components/DashboardNavbar';
import { useState } from 'react';
const DoctorDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen ">
      <DoctorSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}/>

      <div className="flex-1 p-3 sm:p-6 bg-gray-50">
        <div className="mb-4">
          <DashboardNavbar onSidebarToggle={() => setIsSidebarOpen(true)}/>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default DoctorDashboardLayout;
