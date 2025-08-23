import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../store/user';
import { Dropdown } from 'antd';
import { removeToken } from '../helper';
import {
  Menu,
  X,
  Home,
  Stethoscope,
  Info,
  Phone,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const NavBar = () => {
  const [isButtonOpen, setIsButtonOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearUser } = useUserStore();
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleOpenModal = (title, message, onConfirm) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: <Home size={16} className="mr-2" /> },
    { label: 'Find Doctors', path: '/search-doctors', icon: <Stethoscope size={16} className="mr-2" /> },
    { label: 'About', path: '/aboutUs', icon: <Info size={16} className="mr-2" /> },
    { label: 'Contact', path: '/contactPage', icon: <Phone size={16} className="mr-2" /> },
  ];

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
    });
  };
  const handleLogout = () => {
    clearUser();
    removeToken();
    handleCloseModal();
    navigate('/');
  };

  const getDropdownItems = () => {
    const items = [];

    if (user?.role === 'user' && isMobile) {
      navLinks.forEach(link => {
        items.push({
          key: link.path,
          label: (
            <span onClick={() => navigate(link.path)} className="flex items-center w-full">
              {link.icon}
              {link.label}
            </span>
          )
        });
      });
      items.push({ type: 'divider' });
    }

    items.push({
      key: 'dashboard',
      label: (
        <span onClick={() => {
          navigate(
            user?.role === 'admin'
              ? '/admin/dashboard'
              : user?.role === 'doctor'
                ? '/doctor/dashboard'
                : '/user/dashboard'
          );
        }} className="flex items-center w-full">
          <LayoutDashboard size={16} className="mr-2" />
          Dashboard
        </span>
      )
    });

    items.push({
      key: 'logout',
      danger: true,
      label: (
        <span onClick={() => handleOpenModal(
          'Confirm Logout',
          'Are you sure you want to log out of your account?',
          handleLogout
        )} className="flex items-center w-full">
          <LogOut size={16} className="mr-2" />
          Logout
        </span>
      )
    });

    return items;
  };

  return (
    <div className="relative flex items-center justify-between px-3 py-1 md:px-10 ">
      {/* Logo */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 w-[110px] h-[50px] md:w-[130px] md:h-[60px]">
          <img
            src="/xy.png"
            alt="Quick MediLink Logo"
            className="object-contain w-full h-full"
          />
        </div>
      </div>

      {/* Right side group (Nav + Actions) */}
      <div className="flex items-center gap-6">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex">
          {(user?.role === 'user' || user === null) && (
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
                    {React.cloneElement(icon, { size: 18 })}
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons / User Menu */}
        <div className="flex items-center gap-2">
          {/* Logged-in Dropdown */}
          {user && (
            <Dropdown menu={{ items: getDropdownItems() }}>
              <button
                className="w-10 h-10 rounded-full bg-blue-900 text-white font-bold text-lg"
                aria-label="User Menu"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
            </Dropdown>
          )}

          {/* Logged-out Buttons (Desktop) */}
          {!user && (
            <div className="hidden lg:flex gap-4 text-white">
              <button
                onClick={() => navigate('/user/register')}
                className="text-lg font-semibold px-4 py-1.5 rounded-lg bg-blue-900"
              >
                Create Account
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="text-lg font-semibold px-4 py-1.5 rounded-lg bg-blue-900"
              >
                SignIn
              </button>
            </div>
          )}

          {/* Hamburger / X Toggle for mobile (only for logged-out users) */}
          {!user && (
            <div className="lg:hidden">
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
      </div>


      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={handleCloseModal}
        variant='destructive'
      />

      {/* Mobile Menu Panel (only for logged-out users) */}
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
    </div>
  );
};

export default NavBar;
