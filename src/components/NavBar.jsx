import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../store/user';
import { Dropdown } from 'antd';
import {
  Menu,
  X,
  Home,
  Stethoscope,
  Info,
  Phone
} from 'lucide-react';

const NavBar = () => {
  const [isButtonOpen, setIsButtonOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearUser } = useUserStore();

  const navLinks = [
    { label: 'HOME', path: '/', icon: <Home size={18} className="mr-2" /> },
    { label: 'FIND DOCTORS', path: '/search-doctors', icon: <Stethoscope size={18} className="mr-2" /> },
    { label: 'ABOUT', path: '/aboutUs', icon: <Info size={18} className="mr-2" /> },
    { label: 'CONTACT', path: '/contactPage', icon: <Phone size={18} className="mr-2" /> },
  ];

  return (
    <div className="relative flex items-center justify-between px-3 py-1 md:px-10">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0 w-[110px] h-[50px] md:w-[130px] md:h-[60px]">
        <img
          src="/xy.png"
          alt="Quick MediLink Logo"
          className="object-contain w-full h-full"
        />
      </div>

      {/* Desktop Navigation */}

      <div className="hidden lg:flex items-center justify-between space-x-10">
        <div className="flex space-x-5 text-black">
          {navLinks.map(({ label, path, icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`text-lg font-semibold flex items-center transition-all ${isActive
                    ? 'text-blue-700 underline underline-offset-4'
                    : 'hover:underline'
                  }`}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>
        {
          !user && (
            <div className="flex gap-4 text-white">
              <button
                onClick={() => navigate('/user/register')}
                className="text-lg font-semibold px-5 py-2 rounded-lg bg-blue-900"
              >
                Create Account
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="text-lg font-semibold px-5 py-2 rounded-lg bg-blue-900"
              >
                SignIn
              </button>
            </div>
          )
        }
      </div>



      {/* Logged-in Dropdown */}
      {user && (
        <Dropdown
          menu={{
            items: [
              {
                key: 'dashboard',
                label: <span onClick={() => {
                  navigate(
                    user?.role === 'admin'
                      ? '/admin/dashboard'
                      : user?.role === 'doctor'
                        ? '/doctor/dashboard'
                        : '/user/dashboard'
                  );
                }}>Dashboard</span>,
              },
              {
                key: 'logout',
                label: <span onClick={()=>{clearUser(); navigate('/');}}>Logout</span>,
              },
            ],
          }}
        >
          <button
            className="w-10 h-10 rounded-full bg-blue-900 text-white font-bold text-lg"
            aria-label="User Menu"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
        </Dropdown>
      )}

      {/* Mobile Menu */}
      {!user && isButtonOpen && (
        <div className="lg:hidden w-full px-4 py-3 bg-white shadow-md z-50 absolute top-[64px] left-0">
          <div className="flex flex-col gap-3">
            {navLinks.map(({ label, path, icon }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={label}
                  onClick={() => {
                    navigate(path);
                    setIsButtonOpen(false);
                  }}
                  className={`text-left text-lg font-medium flex items-center ${isActive
                      ? 'text-blue-700 underline underline-offset-4'
                      : 'hover:underline'
                    }`}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
            <hr className="my-2" />
            <button
              className="bg-blue-900 text-white text-left px-4 py-2 rounded"
              onClick={() => {
                navigate('/user/register');
                setIsButtonOpen(false);
              }}
            >
              Create Account
            </button>
            <button
              className="bg-blue-900 text-white text-left px-4 py-2 rounded"
              onClick={() => {
                navigate('/signin');
                setIsButtonOpen(false);
              }}
            >
              SignIn
            </button>
          </div>
        </div>
      )}

      {/* Hamburger / X Toggle */}
      {!user && (
        <div className="lg:hidden flex-shrink-0">
          <button
            onClick={() => setIsButtonOpen(!isButtonOpen)}
            aria-label={isButtonOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isButtonOpen}
          >
            {isButtonOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default NavBar;
