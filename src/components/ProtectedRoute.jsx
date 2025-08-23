import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useUserStore from '../store/user';
import StatusPage from '../pages/StatusPage'

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const user = useUserStore(s => s.user);


  if (!user) {
    return <Navigate to="/signin" replace />;
  }


  if ((user.status.user === 'pending' || user.status.user === 'blocked') && (user.role === 'doctor' || user.role === 'user')) {
    return <StatusPage userRole={user.role} status={user.status.user } />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
}
