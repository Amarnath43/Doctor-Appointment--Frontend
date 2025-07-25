import React from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import useUserStore from '../store/user';

const DashboardNavbar = ({ onSidebarToggle }) => {
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();

  const menuItems = [
    {
  key: 'dashboard',
  label: (
    <span
      onClick={() => {
        navigate(
          user?.role === 'admin'
            ? '/admin/dashboard'
            : user?.role === 'doctor'
            ? '/doctor/dashboard'
            : '/user/dashboard'
        );
      }}
    >
      Dashboard
    </span>
  ),
},
{
  key: 'logout',
    label: <span onClick={()=>{clearUser(); navigate('/');}}>Logout</span>,
    },
  ];

return (
  <div className="w-full flex justify-between items-center px-4 md:px-10 py-7 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30 ">
    {/* Left: Hamburger + Logo + Title */}
    <div className="flex items-center gap-3">
      {/* Sidebar toggle (mobile) */}
      <button
        onClick={onSidebarToggle}
        className="lg:hidden text-gray-600 hover:text-black focus:outline-none"
        aria-label="Toggle sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Logo + Title */}
      <div className="flex items-center gap-2">
        <img src="/xy.png" alt="Quick MediLink" className="h-10 w-auto" />

      </div>
    </div>

    {/* Right: User Dropdown */}
    {user && (
      <Dropdown menu={{ items: menuItems }}>
        <button
          className="w-10 h-10 rounded-full bg-blue-900 text-white font-semibold text-lg flex items-center justify-center"
          aria-label="User Menu"
        >
          {user.name?.charAt(0).toUpperCase()}
        </button>
      </Dropdown>
    )}
  </div>
);
};

export default DashboardNavbar;
