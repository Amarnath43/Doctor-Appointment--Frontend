import { useState, useEffect } from 'react';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, DollarSign, X, Clock, Users } from 'lucide-react';
import AxiosInstances from '../../apiManager';



const Analytics = () => {


  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const stats = [
  { 
    label: 'Completed Appointments', 
    value: analytics?.completed, 
    icon: Calendar,
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50'
  },
  { 
    label: 'Total Revenue', 
    value: analytics?.totalRevenue, 
    icon: DollarSign,
    gradient: 'from-blue-500 to-cyan-600',
    bgGradient: 'from-blue-50 to-cyan-50'
  },
  { 
    label: 'Cancelled Appointments', 
    value: analytics?.cancelled, 
    icon: X,
    gradient: 'from-red-500 to-rose-600',
    bgGradient: 'from-red-50 to-rose-50'
  },
  { 
    label: 'Upcoming Appointments', 
    value: analytics?.upcoming, 
    icon: Clock,
    gradient: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-50 to-violet-50'
  },
  {
    label: 'Total Patients',
    value: analytics?.totalPatients,
    icon: Users,
    gradient: 'from-yellow-500 to-amber-600',
    bgGradient: 'from-yellow-50 to-amber-50'
  }
];

   useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await AxiosInstances.get('/doctor/dashboard/analytics');
        console.log(res);
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics()
  },[])


  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-white min-h-[81vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your practice performance and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${item.bgGradient} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${item.gradient} shadow-lg`}>
                  <IconComponent className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">{item.label}</h3>
              <h2 className="text-2xl font-bold text-gray-800">{item.value}</h2>
            </div>
          );
        })}
      </div>

      
    </div>
  );
};

export default Analytics;

/*

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <TrendingUp className="text-white" size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Weekly Appointments Trend</h2>
        </div>
        
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="appointmentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="appointments" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#1d4ed8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
*/

/*
completed appointments
appointments.find({userId:req.user._id});

*/