import React from 'react';
import { Calendar, Clock, User, CreditCard, Stethoscope, CheckCircle, XCircle, Clock3 } from 'lucide-react';

const AppointmentCard = ({ appointment, index, role = 'user', onStatusChange }) => {
  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-800 border border-green-200';
      case 'confirmed':
        return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      case 'cancelled':
        return 'bg-red-50 text-red-800 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 mr-1 text-green-600" />;
      case 'confirmed':
        return <Clock3 className="w-4 h-4 mr-1 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 mr-1 text-red-600" />;
      default:
        return null;
    }
  };

  const canUpdateStatus = (role === 'doctor' && appointment?.status?.toLowerCase() === 'confirmed') || role === 'admin';

  return (
    <div className="relative border-b border-gray-200 px-4 py-3 bg-white transition-all duration-300 ease-in-out">
      {/* Status on top-right */}
      <div className="absolute top-3 right-4">
        {canUpdateStatus ? (
          <select
            value={appointment.status}
            onChange={(e) => onStatusChange(appointment.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className={`px-3 py-1 rounded border text-sm font-medium transition-all duration-300 ${getStatusClasses(appointment?.status)}`}
          >
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        ) : (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${getStatusClasses(appointment.status)}`}>
            {getStatusIcon(appointment.status)}
            {appointment.status}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
          {index}
        </div>

        <div className="flex-1 min-w-0 space-y-3 text-sm text-gray-700">
          {/* Aligned Fields in Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Date:</span> {appointment.date || 'Unknown Date'}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Time:</span> {appointment.time || 'Unknown Time'}
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Payment:</span> {appointment.modeOfPayment || 'N/A'}
            </div>

            {role === 'admin' && (
              <>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Patient:</span> {appointment.patientName || 'Unknown Patient'}
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Doctor:</span> Dr. {appointment.doctorName || 'Unknown Doctor'}
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Specialization:</span> {appointment.specialization || 'N/A'}
                </div>
              </>
            )}

            {role === 'doctor' && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Patient:</span> {appointment.patientName || 'Unknown Patient'}
              </div>
            )}

            {role === 'user' && (
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Doctor:</span> Dr. {appointment.doctorName || 'Unknown Doctor'}
              </div>
            )}

            <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-3">
              <span role="img" aria-label="hospital">🏥</span>
              <span className="font-medium">Hospital:</span> {appointment.hospitalName}
              {appointment.hospitalLocation && (
                <span className="text-gray-500 ml-1">({appointment.hospitalLocation})</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
