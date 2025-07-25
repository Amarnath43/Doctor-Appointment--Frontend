import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/Admin/AdminSidebar';
import DashboardNavbar from '../components/DashboardNavbar';

const AdminDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Right section with scroll */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Sticky Navbar (already handled inside the component) */}
        <DashboardNavbar onSidebarToggle={() => setIsSidebarOpen(true)} />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
