import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import AxiosInstances from '../../apiManager/index'
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const EditProfileModal = ({
  isOpen,
  onClose,
  userData,
  onProfileUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [apiSuccess, setApiSuccess] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [previewImage, setPreviewImage] = useState(userData?.profilePicture || null)
  const [changePassword, setChangePassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setError,
    clearErrors,
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      dob: userData?.dob || '',
      gender: userData?.gender || 'Male',
      bloodGroup: userData?.bloodGroup || 'O+',
      address: userData?.address || '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    mode: 'onChange'
  })

  const watchProfilePicture = watch('profilePicture')
  const watchNewPassword = watch('newPassword')
  const watchConfirmPassword = watch('confirmPassword')

  // Custom validation rules
  const validationRules = {
    name: {
      required: 'Name is required',
      minLength: {
        value: 4,
        message: 'Name must be at least  characters'
      }
    },

    dob: {
      required: 'Date of birth is required',
      validate: (value) => {
        const today = new Date()
        const birthDate = new Date(value)
        const age = today.getFullYear() - birthDate.getFullYear()
        if (age < 0 || age > 150) {
          return 'Please enter a valid date of birth'
        }
        return true
      }
    },
    gender: {
      required: 'Please select a gender'
    },
    bloodGroup: {
      required: 'Please select a blood group'
    },
    address: {
      required: 'Address is required',
      minLength: {
        value: 10,
        message: 'Address must be at least 10 characters'
      }
    },
    oldPassword: changePassword ? {
      required: 'Current password is required'
    } : {},
    newPassword: changePassword ? {
      required: 'New password is required',
      minLength: {
        value: 8,
        message: 'Password must be at least 8 characters'
      },
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }
    } : {},
    confirmPassword: changePassword ? {
      required: 'Please confirm your password',
      validate: (value) => {
        if (value !== watchNewPassword) {
          return 'Passwords do not match'
        }
        return true
      }
    } : {}
  }


const handleFileChange = (e) => {
  const file = e.target.files[0]

  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      setApiError('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setApiError('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result)
    }
    reader.readAsDataURL(file)

    // ✅ Most important step
    setValue('profilePicture', [file])
  }
}


  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && userData) {
      reset({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        dob: userData.dob || '',
        gender: userData.gender || 'Male',
        bloodGroup: userData.bloodGroup || 'O+',
        address: userData.address || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setPreviewImage(userData.profilePicture || null)
      setChangePassword(false)
      setApiError('')
      setApiSuccess('')
    }
  }, [isOpen, userData, reset])

  // Validate password confirmation in real-time
  useEffect(() => {
    if (changePassword && watchNewPassword && watchConfirmPassword) {
      if (watchNewPassword !== watchConfirmPassword) {
        setError('confirmPassword', {
          type: 'manual',
          message: 'Passwords do not match'
        })
      } else {
        clearErrors('confirmPassword')
      }
    }
  }, [watchNewPassword, watchConfirmPassword, changePassword, setError, clearErrors])

  const onSubmit = async (data) => {
    console.log(data)
    setIsLoading(true)
    setApiError('')
    setApiSuccess('')

    try {
      // Additional validation for password change
      if (changePassword) {
        if (!data.oldPassword || !data.newPassword || !data.confirmPassword) {
          setApiError('All password fields are required when changing password')
          setIsLoading(false)
          return
        }
        if (data.newPassword !== data.confirmPassword) {
          setApiError('New passwords do not match')
          setIsLoading(false)
          return
        }
        if (data.newPassword.length < 8) {
          setApiError('New password must be at least 8 characters')
          setIsLoading(false)
          return
        }
      }

      const formData = new FormData()

      // Append basic profile data
      formData.append('name', data.name)
      const safeDOB = data.dob && !isNaN(new Date(data.dob)) 
  ? new Date(data.dob).toISOString().split('T')[0] 
  : ''
      formData.append('dob', safeDOB)
      formData.append('gender', data.gender)
      formData.append('bloodGroup', data.bloodGroup)
      formData.append('address', data.address)
      
      // Append profile picture if selected
      if (data.profilePicture && data.profilePicture[0]) {
        formData.append('profilePicture', data.profilePicture[0])
      }

      // Append password data if changing password
      if (changePassword) {
        formData.append('changePassword', 'true')
        formData.append('oldPassword', data.oldPassword)
        formData.append('newPassword', data.newPassword)
      }
    
      // Make API request
      const response = await AxiosInstances.put('/user/edit-profile', formData
      )

      const newData=response.data.user;
      console.log(newData)

      setApiSuccess('Profile updated successfully!')

      // Call the callback with updated user data
      
      if (onProfileUpdated) {
        onProfileUpdated(newData)
      }


      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (error) {
      console.error('Profile update error:', error)
      setApiError(
        error.response?.data?.message ||
        'Failed to update profile. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isDirty && !isLoading) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }


  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl animate-slide-up mx-2 max-h-[100vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-white">Edit Profile</h2>
              <button
                onClick={handleClose}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                disabled={isLoading}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="p-3 sm:p-4">
              {/* API Messages */}
              {apiError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm">{apiError}</span>
                </div>
              )}

              {apiSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm">{apiSuccess}</span>
                </div>
              )}

              {/* Profile Picture Section */}
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4 text-gray-600" />
                  Profile Picture
                </h3>
                <div className="relative inline-block">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-gray-500 text-sm sm:text-base font-medium">
                        {userData?.name ? getInitials(userData.name) : 'U'}
                      </span>
                    </div>
                  )}
                  <label
                    htmlFor="profilePicture"
                    className="absolute bottom-0 right-0 bg-gray-600 hover:bg-gray-700 text-white p-1 sm:p-1.5 rounded-full cursor-pointer transition-colors shadow-sm"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  {...register('profilePicture')}
                  onChange={handleFileChange}
                  className="hidden"
                  id="profilePicture"
                />
                <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
              </div>

              {/* Personal Information Section */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <User className="w-3 h-3 text-gray-500" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('name', validationRules.name)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all text-xs sm:text-sm ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                        }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <Mail className="w-3 h-3 text-gray-500" />
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed text-xs sm:text-sm"
                      placeholder="Email address"
                    />
                    <p className="text-xs text-gray-400">Contact support to change email</p>
                  </div>


                  {/* Phone (Read-only) */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <Phone className="w-3 h-3 text-gray-400" />
                      Phone Number
                    </label>
                    <input
                      type="text"
                      {...register('phone')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed text-xs sm:text-sm"
                      placeholder="Phone number"
                      readOnly
                    />
                    <p className="text-xs text-gray-400">Contact support to change phone number</p>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('dob', validationRules.dateOfBirth)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all text-xs sm:text-sm ${errors.dateOfBirth ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                        }`}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('gender', validationRules.gender)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all text-xs sm:text-sm ${errors.gender ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                        }`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('bloodGroup', validationRules.bloodGroup)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all text-xs sm:text-sm ${errors.bloodGroup ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                        }`}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {errors.bloodGroup && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.bloodGroup.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address - Full Width */}
                <div className="space-y-1.5 mt-3 sm:mt-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('address', validationRules.address)}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all resize-none text-xs sm:text-sm ${errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                      }`}
                    placeholder="Enter your complete address"
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Change Password Section */}
              <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <input
                    type="checkbox"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    id="changePassword"
                    className="w-3 h-3 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <label htmlFor="changePassword" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <Lock className="w-3 h-3 text-gray-500" />
                    Change Password
                  </label>
                </div>

                {changePassword && (
                  <div className="space-y-3 pl-5 border-l-2 border-yellow-200">
                    <h4 className="text-xs font-medium text-gray-700 -ml-5 pl-5 pb-2 border-b border-yellow-200">
                      Password Update
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Old Password */}
                      <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-xs font-medium text-gray-700">
                          Current Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showOldPassword ? 'text' : 'password'}
                            {...register('oldPassword', validationRules.oldPassword)}
                            className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all text-xs sm:text-sm ${errors.oldPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                              }`}
                            placeholder="Enter your current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.oldPassword && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.oldPassword.message}
                          </p>
                        )}
                      </div>

                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            {...register('newPassword', validationRules.newPassword)}
                            className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all text-xs sm:text-sm ${errors.newPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                              }`}
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.newPassword && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...register('confirmPassword', validationRules.confirmPassword)}
                            className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all text-xs sm:text-sm ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                              }`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Form Actions - Fixed at bottom */}
          <div className="bg-gray-50 px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium text-xs sm:text-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit(onSubmit)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditProfileModal