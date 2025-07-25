import React, { useEffect, useState } from 'react';
import { Card, Statistic, Spin } from 'antd';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Users, 
  UserCheck, 
  UserX, 
  Stethoscope, 
  Heart, 
  Shield 
} from 'lucide-react';
import AxiosInstances from '../../apiManager';

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await AxiosInstances.get('/admin/dashboard-stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <p className="text-center text-gray-600">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  const cards = [
    { 
      label: 'Total Appointments', 
      value: stats.totalAppointments, 
      icon: Calendar, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    { 
      label: 'Completed Appointments', 
      value: stats.completedAppointments, 
      icon: CheckCircle, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    { 
      label: 'Cancelled Appointments', 
      value: stats.cancelledAppointments, 
      icon: XCircle, 
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    { 
      label: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    { 
      label: 'Active Users', 
      value: stats.activeUsers, 
      icon: UserCheck, 
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    { 
      label: 'Blocked Users', 
      value: stats.blockedUsers, 
      icon: UserX, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    { 
      label: 'Total Doctors', 
      value: stats.totalDoctors, 
      icon: Stethoscope, 
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600'
    },
    { 
      label: 'Active Doctors', 
      value: stats.activeDoctors, 
      icon: Heart, 
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600'
    },
    { 
      label: 'Blocked Doctors', 
      value: stats.blockedDoctors, 
      icon: Shield, 
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600'
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card 
              key={index}
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-full ${card.bgColor}`}>
                    <IconComponent className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div className={`w-12 h-1 bg-gradient-to-r ${card.color} rounded-full`}></div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <Statistic
                    value={card.value}
                    valueStyle={{ 
                      color: '#1f2937', 
                      fontSize: '26px', 
                      fontWeight: '700',
                      lineHeight: '1.2'
                    }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardStats;