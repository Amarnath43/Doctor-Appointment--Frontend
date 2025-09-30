import { useEffect, useState, useMemo } from 'react';
import {
  User, Mail, Phone, Calendar, MapPin, Edit3
} from 'lucide-react';
import EditProfileModal from './EditProfileModal'; // Adjust path if needed
import useUserStore from '../../store/user';
import { makePublicUrlFromKey } from '../../utils/s3PublicUrl';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../utils/fetcher';

const UserProfile = () => {
  const { setUser } = useUserStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: user, error, isLoading } = useSWR('/user/profile', fetcher);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  const userData = useMemo(() => {
    if (!user) return null;
    const profileImageUrl = user.profilePicture
      ? makePublicUrlFromKey(user.profilePicture)
      : null;
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: profileImageUrl,
      dob: user.profile?.dob,
      gender: user.profile?.gender,
      bloodGroup: user.profile?.bloodGroup,
      address: user.profile?.address,
      updatedAt: user.updatedAt,
    };
  }, [user]);

  const handleProfileUpdated = (updatedUser) => {
    setUser(updatedUser);
    mutate('/user/profile', updatedUser , false); // Optimistically update and prevent re-fetch
    setIsEditModalOpen(false);
  };

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString || !new Date(dateString).getTime()) {
      return 'Not Provided';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEditProfile = () => setIsEditModalOpen(true);
  const handleCloseModal = () => setIsEditModalOpen(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-140px)]">Loading...</div>;
  }
  if (error || !userData) {
    return <div className="flex items-center justify-center h-[calc(100vh-140px)]">Could not load profile.</div>;
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-gray-50 overflow-y-auto">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Patient Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your profile and account settings</p>
          </div>
          <button
            onClick={handleEditProfile}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden mb-6 ">
          <div className="h-24 md:h-32 bg-gradient-to-r " />
          <div className="px-6 pb-6 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {userData.profilePicture ? (
                <img
                  src={`${userData.profilePicture}?t=${new Date(userData.updatedAt || Date.now()).getTime()}`}
                  alt="Profile"
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white object-cover shadow-lg bg-gray-200"
                />
              ) : (
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white flex items-center justify-center shadow-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff&size=128)` }}
                >
                  <span className="opacity-0">{getInitials(userData.name)}</span>
                </div>
              )}
              <div className="text-center sm:text-left sm:pb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{userData.name}</h2>
                <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {userData.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard icon={Phone} label="Phone Number" value={userData.phone} color="blue" />
          <InfoCard icon={Calendar} label="Date of Birth" value={formatDate(userData.dob)} color="green" />
          <InfoCard icon={User} label="Gender" value={userData.gender} color="purple" />
          <InfoCard icon={User} label="Blood Group" value={userData.bloodGroup} color="red" />
          <InfoCard icon={MapPin} label="Address" value={userData.address} color="orange" className="sm:col-span-2 lg:col-span-2" />
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          userData={userData}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value, color, className = '' }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 ${className}`}>
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold text-${color}-600 uppercase tracking-wide mb-1`}>{label}</p>
        <p className="text-sm font-bold text-gray-900 break-words">{value || 'Not Provided'}</p>
      </div>
    </div>
  </div>
);

export default UserProfile;