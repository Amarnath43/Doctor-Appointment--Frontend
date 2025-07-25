import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AxiosInstances from '../../apiManager';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Phone,
  Mail,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const AppointmentDetails = () => {
  const navigate = useNavigate();

  const { appointmentId } = useParams();
  const [appt, setAppt] = useState(null);

  useEffect(() => {
    const appts = async () => {
      let res = await AxiosInstances.get(`/appointments/${appointmentId}`);
      setAppt(res.data.appointment)
      console.log(res.data.appointment)
    }

    appts();


  }, [appointmentId]);

  


  if (!appt) return <p>Loading…</p>;
  const isInactive = appt?.status === 'Cancelled' || appt?.status === 'Completed';

   const handleCancel = async (id) => {
  try {
    await AxiosInstances.patch(`/appointments/cancel/${id}`);
    toast.success('Appointment cancelled');
    // refresh list
  } catch (err) {
    toast.error('Failed to cancel appointment');
  }
};

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Appointment Details
            </h1>
            <p className="text-gray-600">
              ID: {appt._id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 mr-2 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Doctor Information
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {appt.doctorId.userId.name}
                    </h3>
                    <p className="text-gray-600">
                      {appt.doctorId.specialization}
                    </p>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-700">
                        {appt.doctorId.hospital.phoneNumber}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-700">
                        {appt.doctorId.userId.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Appointment Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Date & Time */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Date & Time
                    </h4>
                    <p className="text-gray-700">{appt.date.split('T')[0]}</p>
                    <p className="text-gray-700">{appt.slot}</p>
                  </div>
                  {/* Type */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Payment Mode
                    </h4>
                    <p className="text-gray-700">
                      {appt.paymentMode}
                    </p>
                  </div>
                  {/* Location */}
                  <div className="sm:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Location
                    </h4>
                    <p className="text-gray-700">
                      {appt.doctorId.hospital.location}
                    </p>
                  </div>
                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Google Maps Link
                    </h4>
                    <a className="text-blue-700" href={appt.doctorId.hospital.googleMapsLink} target='_blank'>Click here</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="mb-4 font-semibold text-gray-900">Status</h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 ${appt.status === "cancelled" ? "bg-red-500" : "bg-green-500"} rounded-full mr-2`} />
                <span className={`font-semibold ${appt.status === "cancelled" ? "text-red-500" : "text-green-500"}`}>
                  {appt.status}
                </span>
              </div>
            </div>

            {/* Fee Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Fee Information
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Consultation Fee:
                  </span>
                  <span className="font-semibold">
                    {appt.doctorId.fee}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹ {appt.doctorId.fee}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6 space-y-3">
              <button
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                onClick={() => handleReschedule(appointmentId)}
                disabled={isInactive}
              >
                Reschedule Appointment
              </button>

              <button
                className="w-full py-2 border border-red-500 rounded-lg text-red-600 hover:bg-red-50"
                onClick={() => handleCancel(appointmentId)}
                disabled={isInactive}
              >
                Cancel Appointment
              </button>

              <button
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                onClick={() => handleAddToCalendar(appointment)}
                disabled={isInactive}
              >
                Add to Calendar
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
