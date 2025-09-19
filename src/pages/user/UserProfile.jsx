import { useEffect, useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Edit3,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  Activity
} from 'lucide-react'
import EditProfileModal from './EditProfileModal'
import useUserStore from '../../store/user'
import { makePublicUrlFromKey } from '../../utils/s3PublicUrl'

const UserProfile = () => {
  const {user, setUser}=useUserStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  let profileImageUrl = null;
  if (user?.profilePicture) {
    try {

      profileImageUrl = makePublicUrlFromKey(user.profilePicture);
    } catch (error) {
      console.error('Failed to get public image URL:', error);
    }
  }

  const userData = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    profilePicture: profileImageUrl, 
    dob: user?.profile?.dob || "",
    gender: user?.profile?.gender,
    bloodGroup: user?.profile?.bloodGroup,
    address: user?.profile?.address
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
  }

  const handleProfileUpdated = (updatedUser) => {
    setUser(updatedUser)
    console.log('Profile updated:', updatedUser)
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-gray-50">
      {/* Page Header */}
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

      {/* Main Content */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden mb-6">
          <div className="h-24 md:h-32" />
          <div className="px-6 pb-6 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {userData.profilePicture ? (
                <img
                  src={userData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          userData.profilePicture || 'Doctor'
                        )}&background=random`}
                  alt="Profile"
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center shadow-lg">
                  <span className="text-3xl sm:text-4xl font-bold text-slate-600">
                    {getInitials(userData.name)}
                  </span>
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

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Phone Number */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">PHONE NUMBER</p>
                <p className="text-sm font-bold text-gray-900 truncate">{userData.phone}</p>
              </div>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">DATE OF BIRTH</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(userData.dob)}</p>
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">GENDER</p>
                <p className="text-sm font-bold text-gray-900">{userData.gender}</p>
              </div>
            </div>
          </div>

          {/* Blood Group */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">B</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">BLOOD GROUP</p>
                <p className="text-sm font-bold text-gray-900">{userData.bloodGroup}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2 lg:col-span-2 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">ADDRESS</p>
                <p className="text-sm font-bold text-gray-900 leading-relaxed">{userData.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        userData={userData}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  )
}

export default UserProfile