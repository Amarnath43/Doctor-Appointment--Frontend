// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useUserStore from '../store/user';


export default function ProtectedRoute({ allowedRoles = [] }) {
  const user = useUserStore(s => s.user);

  // not even logged in?
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // logged in but wrong role?
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // authorized: render child routes
  return <Outlet />;
}
