
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Stethoscope, 
  IndianRupee, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import AxiosInstances from '../../apiManager/index';
import { Navigate } from 'react-router-dom';

const AppointmentList = () => {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate=useNavigate();

  // Determine the status based on the route path
  const getStatusFromPath = () => {
    if (location.pathname.includes('upcoming')) return 'Confirmed';
    if (location.pathname.includes('past')) return 'Completed';
    if (location.pathname.includes('cancelled')) return 'Cancelled';
    return '';
  };

  const status = getStatusFromPath();

  // Get status icon and color
  const getStatusDisplay = (appointmentStatus) => {
    switch (appointmentStatus) {
      case 'Confirmed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-green-600 bg-green-50',
          text: 'Confirmed'
        };
      case 'Completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-blue-600 bg-blue-50',
          text: 'Completed'
        };
      case 'Cancelled':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-600 bg-red-50',
          text: 'Cancelled'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'text-gray-600 bg-gray-50',
          text: 'Unknown'
        };
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await AxiosInstances.get(`/user/appointments?status=${status}`);
        setAppointments(res.data);
        console.log(res.data);
      } catch (err) {
        setError('Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {status} Appointments
          </h2>
        </div>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {appointments.length}
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            No {status} appointments found
          </h3>
          <p className="text-gray-500 text-sm">
            Your {status} appointments will appear here when available.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, index) => {
            const statusDisplay = getStatusDisplay(apt.status);
            
            return (
              <div
                key={apt._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                onClick={() => navigate(`/appointment/${apt._id}`)}
              >
                {/* Header with appointment number and status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                  </div>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                    {statusDisplay.icon}
                    <span>{statusDisplay.text}</span>
                  </div>
                </div>

                {/* Main content - responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  {/* Patient */}
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs">Patient</p>
                      <p className="font-medium text-gray-800 truncate">
                        {apt.userId?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Doctor */}
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs">Doctor</p>
                      <p className="font-medium text-gray-800 truncate">
                        Dr. {apt.doctorId?.userId?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs">Specialization</p>
                      <p className="font-medium text-gray-800 truncate">
                        {apt.doctorId?.specialization || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Fee */}
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-xs">Fee</p>
                      <p className="font-semibold text-gray-800">
                        ₹{apt.doctorId?.fee || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
