import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AxiosInstances from '../../apiManager';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Calendar, Clock, MapPin, DollarSign, User, AlertTriangle, RefreshCw, X
} from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal'
import { makePublicUrlFromKey } from '../../utils/s3PublicUrl';

// Helper to fetch data
const fetchAppointment = async (appointmentId) => {
  const res = await AxiosInstances.get(`/appointments/${appointmentId}`);
  return res.data.appointment;
};

// Reusable component for info sections
const InfoCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-4">
      <Icon className="w-6 h-6 text-indigo-500" />
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// Reusable component for individual details
const DetailItem = ({ label, value, children }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <div className="mt-1 text-base text-gray-800 font-semibold">{children || value}</div>
  </div>
);

const AppointmentDetails = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const queryClient = useQueryClient();

  // State for the confirmation modal
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetching data with React Query
  const { data: appt, isLoading, isError } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
    enabled: !!appointmentId,
  });

  const isInactive = appt?.status === 'Cancelled' || appt?.status === 'Completed';

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await AxiosInstances.patch(`/appointments/cancel/${appointmentId}`);
      toast.success('Appointment cancelled successfully');
      // Invalidate the query to refetch fresh data
      queryClient.invalidateQueries(['appointment', appointmentId]);
    } catch (err) {
      toast.error('Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
      setModalOpen(false);
    }
  };

  const handleReschedule = () => {
    const path = `/doctor/${appt.doctorId._id}?rescheduleFrom=${appointmentId}`;
    navigate(path);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (isError || !appt) {
    return <div className="flex justify-center items-center h-screen">Error loading appointment details.</div>;
  }
  
  // Helper for status styling
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  if(!appt)
  {
    return <p>Loading...puuu</p>
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 mr-4">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointment Details</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {appt._id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              <InfoCard title="Doctor Information" icon={User}>
                <div className="flex items-center gap-4">
                  <img
                    src={makePublicUrlFromKey(appt.doctorId?.userId?.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.doctorId?.userId?.name)}&background=random`}
                    alt={appt.doctorId?.userId?.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{appt.doctorId?.userId?.name}</h3>
                    <p className="text-indigo-600 font-medium">{appt.doctorId?.specialization}</p>
                  </div>
                </div>
              </InfoCard>

              <InfoCard title="Appointment Details" icon={Calendar}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <DetailItem label="Date & Time">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{new Date(appt?.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={16} className="text-gray-400" />
                      <span>{appt?.slot}</span>
                    </div>
                  </DetailItem>
                  <DetailItem label="Payment Mode" value={appt?.paymentMode} />
                  <div className="sm:col-span-2">
                    <DetailItem label="Location">
                      <a href={appt.doctorId?.hospital?.googleMapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline">
                        <MapPin size={16} />
                        <span>{appt.doctorId?.hospital?.location}</span>
                      </a>
                    </DetailItem>
                  </div>
                </div>
              </InfoCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-bold text-gray-800 mb-3">Status</h3>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyles(appt.status)}`}>
                  {appt.status}
                </div>
              </div>

              <InfoCard title="Payment Summary" icon={DollarSign}>
                <div className="flex justify-between text-gray-600">
                  <span>Consultation Fee</span>
                  <span className="font-medium text-gray-800">₹{appt.doctorId?.fee}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total Paid</span>
                  <span>₹{appt.doctorId?.fee}</span>
                </div>

              </InfoCard>

              {/* Actions */}
              {!isInactive && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Actions</h3>
                  <button onClick={handleReschedule} className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors">
                    <RefreshCw size={16} /> Reschedule
                  </button>
                  <button onClick={() => setModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 bg-red-50 rounded-lg text-red-700 font-semibold hover:bg-red-100 transition-colors">
                    <X size={16} /> Cancel Appointment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        onConfirm={handleCancel}
        onCancel={() => setModalOpen(false)}
        isConfirming={isCancelling}
        confirmText="Yes, Cancel"
        variant="destructive"
      />
    </>
  );
};

export default AppointmentDetails;