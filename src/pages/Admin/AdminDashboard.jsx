import React from 'react';
import DashboardStats from '../../components/Admin/DashboardStats'

const AdminDashboard = () => {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Admin Analytics</h1>
      <DashboardStats />
    </div>
  );
};

export default AdminDashboard;
