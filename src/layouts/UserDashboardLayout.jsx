import React from 'react'
import { Outlet } from 'react-router-dom';
import { useState } from 'react';

import UserSidebar from '../components/user/UserSidebar';
import DashboardNavbar from '../components/DashboardNavbar';
const UserDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <UserSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">

        <DashboardNavbar onSidebarToggle={() => setIsSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default UserDashboardLayout






