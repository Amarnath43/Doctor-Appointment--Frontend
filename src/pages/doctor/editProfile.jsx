import { useEffect, useState, useMemo } from 'react';
import {
  Mail,
  Phone,
  Stethoscope,
  Calendar,
  Edit3,
  MapPin,
  Home,
  Activity,
  IndianRupee
} from 'lucide-react';
import EditProfileForm from './editProfileForm'; // Adjust path if needed
import useUserStore from '../../store/user';
import { makePublicUrlFromKey } from '../../utils/s3PublicUrl';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../utils/fetcher';

const DoctorProfile = () => {
  const { setUser } = useUserStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: user, error, isLoading } = useSWR('/doctor/profile', fetcher);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);
  
  const doctorData = useMemo(() => {
    if (!user) return null;
    const profileImageUrl = user.profilePicture
      ? makePublicUrlFromKey(user.profilePicture)
      : null;
    return {
      ...user,
      profilePicture: profileImageUrl,
      hospital: user.hospital || {}
    };
  }, [user]);

  const handleProfileUpdated = (updatedUser) => {
    setUser(updatedUser);
    mutate('/doctor/profile', { ...user, ...updatedUser }, false); // Optimistically update and prevent re-fetch
    setIsEditModalOpen(false);
  };
  
  const getInitials = (name = '') => {
    return name?.split(' ').map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  const handleEditProfile = () => setIsEditModalOpen(true);
  const handleCloseModal = () => setIsEditModalOpen(false);
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-140px)]">Loading profile...</div>;
  }
  if (error || !doctorData) {
    return <div className="flex items-center justify-center h-[calc(100vh-140px)]">Could not load profile.</div>;
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-gray-50 relative overflow-y-auto">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Doctor Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your profile and hospital info</p>
          </div>
          <button
            onClick={handleEditProfile}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {doctorData.profilePicture ? (
              <img
                src={`${doctorData.profilePicture}?t=${new Date(doctorData.updatedAt || Date.now()).getTime()}`}
                alt="Doctor"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white object-cover shadow-lg bg-gray-200"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-2 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-gray-700">{getInitials(doctorData.name)}</span>
              </div>
            )}
            <div className="text-white">
              <h2 className="text-2xl sm:text-3xl font-bold">{doctorData.name}</h2>
              <p className="text-blue-100 flex items-center justify-center sm:justify-start gap-2 mt-2 text-base">
                <Mail className="w-4 h-4" />
                {doctorData.email}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard icon={Phone} label="Phone Number" value={doctorData.phone} color="blue" />
          <InfoCard icon={Stethoscope} label="Specialization" value={doctorData.specialization} color="green" />
          <InfoCard icon={Calendar} label="Experience" value={doctorData.experience ? `${doctorData.experience} yrs` : '-'} color="purple" />
          <InfoCard icon={IndianRupee} label="Consultation Fee" value={doctorData.fee ? `₹${doctorData.fee}`: '-'} color="red" />
          <InfoCard icon={Activity} label="Bio" value={doctorData.bio} color="orange" className="sm:col-span-2" />
        </div>

        {doctorData.hospital && Object.keys(doctorData.hospital).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Hospital Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard icon={Home} label="Hospital Name" value={doctorData.hospital.name} color="cyan" />
              <InfoCard icon={MapPin} label="Location" value={doctorData.hospital.location} color="yellow" />
              <InfoCard icon={Phone} label="Contact" value={doctorData.hospital.phoneNumber} color="blue" />
            </div>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EditProfileForm
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          initialData={doctorData}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value, color = 'blue', className = '' }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 ${className}`}>
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold text-${color}-600 uppercase tracking-wide mb-1`}>{label}</p>
        <p className="text-sm font-bold text-gray-900 break-words">{value || '-'}</p>
      </div>
    </div>
  </div>
);

export default DoctorProfile;