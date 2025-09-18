// src/components/GuestOnly.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useUserStore from '../store/user';
import StatusPage from '../pages/StatusPage';

function getDashboardPath(role) {
  if (role === 'doctor') return '/doctor/home';
  if (role === 'admin') return '/admin/home';
  return '/';
}

export default function GuestOnly({ children }) {
  const user = useUserStore((s) => s.user);
  const location = useLocation();

  if (!user) return <>{children}</>;

  if (
    (user.role === 'doctor' || user.role === 'user') &&
    (user.status?.user === 'pending' || user.status?.user === 'blocked')
  ) {
    return <StatusPage userRole={user.role} status={user.status.user} />;
  }

  return (
    <Navigate
      to={getDashboardPath(user.role)}
      state={{ from: location }}
      replace
    />
  );
}
