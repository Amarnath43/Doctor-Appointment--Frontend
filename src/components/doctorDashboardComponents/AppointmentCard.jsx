import React from 'react';
import { Calendar, Clock, User, CreditCard, Stethoscope } from 'lucide-react';

const AppointmentCard = ({ appointment, index, role = 'user', onStatusChange }) => {
  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canUpdateStatus = role === 'doctor' && appointment.status?.toLowerCase() === 'confirmed';

 

  return (
    <div className="border rounded-xl p-4 shadow hover:shadow-md transition-shadow duration-200 bg-white" >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left section */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
            {index}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Date & Time */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {appointment.date || 'Unknown Date'}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {appointment.time || 'Unknown Time'}
              </div>
            </div>

            {/* Role-specific display */}
            {role === 'admin' && (
              <>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <User className="w-4 h-4 text-gray-500" />
                  {appointment.patientName || 'Unknown Patient'}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <Stethoscope className="w-4 h-4 text-gray-500" />
                  Dr. {appointment.doctorName || 'Unknown Doctor'}
                </div>
              </>
            )}

            {role === 'doctor' && (
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                {appointment.patientName || 'Unknown Patient'}
              </div>
            )}

            {role === 'user' && (
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <Stethoscope className="w-4 h-4 text-gray-500" />
                Dr. {appointment.doctorName || 'Unknown Doctor'}
              </div>
            )}

             <div className="flex items-center gap-1 text-sm text-gray-700">
                <span role="img" aria-label="hospital">🏥</span>
                {appointment.hospitalName}
                {appointment.hospitalLocation && (
                  <span className="text-gray-500 ml-2">— {appointment.hospitalLocation}</span>
                )}
              </div>

            {/* Payment */}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <CreditCard className="w-4 h-4 text-gray-500" />
              {appointment.modeOfPayment || 'N/A'}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 self-start sm:self-center">
          {canUpdateStatus ? (
            <select
              value={appointment.status}
              onChange={(e) => onStatusChange(appointment.id, e.target.value)}
              className="px-3 py-1 rounded-full border text-sm text-gray-700"
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          ) : (
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusClasses(
                appointment.status
              )}`}
            >
              {appointment.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
