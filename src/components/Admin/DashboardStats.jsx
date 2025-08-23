import React, { useEffect, useState } from 'react';
import { Statistic } from 'antd';
import { 
  Calendar, CheckCircle, XCircle, Users, UserCheck, 
  UserX, Stethoscope, Heart, Shield, AlertTriangle, Loader2 
} from 'lucide-react';
import AxiosInstances from '../../apiManager';

// Configuration for the stat cards, moved outside the main component
const getCardsConfig = (stats) => [
  { 
    label: 'Total Appointments', 
    value: stats.totalAppointments, 
    icon: Calendar, 
    color: 'blue'
  },
  { 
    label: 'Completed Appointments', 
    value: stats.completedAppointments, 
    icon: CheckCircle, 
    color: 'green'
  },
  { 
    label: 'Cancelled Appointments', 
    value: stats.cancelledAppointments, 
    icon: XCircle, 
    color: 'red'
  },
  { 
    label: 'Total Users', 
    value: stats.totalUsers, 
    icon: Users, 
    color: 'purple'
  },
  { 
    label: 'Active Users', 
    value: stats.activeUsers, 
    icon: UserCheck, 
    color: 'emerald'
  },
  { 
    label: 'Blocked Users', 
    value: stats.blockedUsers, 
    icon: UserX, 
    color: 'orange'
  },
  { 
    label: 'Total Doctors', 
    value: stats.totalDoctors, 
    icon: Stethoscope, 
    color: 'teal'
  },
  { 
    label: 'Active Doctors', 
    value: stats.activeDoctors, 
    icon: Heart, 
    color: 'pink'
  },
  { 
    label: 'Blocked Doctors', 
    value: stats.blockedDoctors, 
    icon: Shield, 
    color: 'amber'
  },
];

// Reusable StatCard component for a cleaner and more modular approach
const StatCard = ({ label, value, icon: Icon, color }) => {
  // TailwindCSS JIT compiler needs to see the full class names, 
  // so we use a map to associate colors with their full class strings.
  const colorClasses = {
    blue:    { bg: 'bg-blue-100', text: 'text-blue-600' },
    green:   { bg: 'bg-green-100', text: 'text-green-600' },
    red:     { bg: 'bg-red-100', text: 'text-red-600' },
    purple:  { bg: 'bg-purple-100', text: 'text-purple-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    orange:  { bg: 'bg-orange-100', text: 'text-orange-600' },
    teal:    { bg: 'bg-teal-100', text: 'text-teal-600' },
    pink:    { bg: 'bg-pink-100', text: 'text-pink-600' },
    amber:   { bg: 'bg-amber-100', text: 'text-amber-600' },
  };

  const selectedColor = colorClasses[color] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`p-2 rounded-lg ${selectedColor.bg}`}>
          <Icon className={`w-6 h-6 ${selectedColor.text}`} />
        </div>
      </div>
      <div className="mt-2">
        <h2 className="text-3xl font-bold text-gray-800">
          {/* Format number with commas for better readability */}
          {value.toLocaleString()}
        </h2>
      </div>
    </div>
  );
};

// Skeleton component to show while data is loading
const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 9 }).map((_, index) => (
      <div key={index} className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-3/5"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="mt-4 h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    ))}
  </div>
);

// Main DashboardStats component
const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await AxiosInstances.get('/admin/dashboard-stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertTriangle className="w-10 h-10 mb-2" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  // Generate the card data once stats are available
  const cardsData = stats ? getCardsConfig(stats) : [];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardsData.map((card, index) => (
          <StatCard 
            key={index}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;