import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AxiosInstances from '../../apiManager/index';
import ImageCropper from '../../components/Cropper';
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
} from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';

const EditProfileModal = ({
  isOpen,
  onClose,
  userData,
  onProfileUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [isCloseModalOpen, setCloseModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    getValues
  } = useForm({
    // Use userData from props for initial default values
  });
  
  // Watch the new password field to validate confirmation
  const watchNewPassword = watch('newPassword');

  // Custom validation rules, simplified for clarity
  const validationRules = {
    name: {
      required: 'Name is required',
      minLength: {
        value: 4,
        message: 'Name must be at least 4 characters'
      }
    },
    dob: {
      required: 'Date of birth is required',
      validate: (value) => {
        const today = new Date();
        const birthDate = new Date(value);
        if (isNaN(birthDate.getTime())) return 'Invalid date';
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 0 || age > 120) {
          return 'Please enter a valid date of birth';
        }
        return true;
      }
    },
    gender: { required: 'Please select a gender' },
    bloodGroup: { required: 'Please select a blood group' },
    address: {
      required: 'Address is required',
      minLength: {
        value: 10,
        message: 'Address must be at least 10 characters'
      }
    },
    oldPassword: { required: 'Current password is required' },
    newPassword: {
      required: 'New password is required',
      minLength: { value: 8, message: 'Password must be at least 8 characters' },
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        message: 'Must contain an uppercase letter, a lowercase letter, and a number'
      }
    },
    confirmPassword: {
      required: 'Please confirm your password',
      validate: (value) => value === watchNewPassword || 'Passwords do not match'
    }
  };

  // Effect to reset form when modal opens with new data
  useEffect(() => {
    if (isOpen && userData) {
      reset({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        dob: userData.dob ? userData.dob.split('T')[0] : '',
        gender: userData.gender || 'Male',
        bloodGroup: userData.bloodGroup || 'O+',
        address: userData.address || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPreviewImage(userData.profilePicture || null);
      setChangePassword(false);
      setApiError('');
      setApiSuccess('');
    }
  }, [isOpen, userData, reset]);

  // Effect to clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setApiError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setApiError('Please select a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setCropMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      let uploadedKey = '';
      const newProfilePictureFile = getValues('profilePicture');

      // 1. Handle new image upload if one exists
      if (newProfilePictureFile && newProfilePictureFile[0]) {
        const file = newProfilePictureFile[0];
        const contentType = file.type;

        const { data: presigned } = await AxiosInstances.get(
          `/uploads/public-presigned-upload-url`,
          { params: { folder: 'users', contentType } }
        );

        await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file
        });
        uploadedKey = presigned.key;
      } 
      // 2. If no new image, parse the key from the existing full URL
      else if (userData?.profilePicture) {
        try {
          const url = new URL(userData.profilePicture);
          const pathname = url.pathname;
          uploadedKey = pathname.startsWith('/') ? pathname.slice(1) : pathname;
        } catch {
          uploadedKey = userData.profilePicture; // Fallback if it's not a full URL
        }
      }

      // 3. Construct the payload for the API
      const payload = {
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        address: data.address,
        profilePicture: uploadedKey
      };

      // 4. Add password fields only if user intends to change it
      if (changePassword) {
        payload.changePassword = true;
        payload.oldPassword = data.oldPassword;
        payload.newPassword = data.newPassword;
      }

      const response = await AxiosInstances.put('/user/edit-profile', payload);
      const newData = response.data.user;

      setApiSuccess('Profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated(newData);

      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('Profile update failed:', err);
      setApiError(
        err.response?.data?.message || 'Something went wrong while updating profile'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    const hasNewPicture = !!getValues('profilePicture');
    if ((isDirty || hasNewPicture) && !isLoading) {
      setCloseModalOpen(true);
    } else {
      onClose();
    }
  };

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={handleClose}
        />
        
        {/* Cropper Modal */}
        {cropMode && previewImage && (
          <div className="fixed inset-0 z-[51] bg-black/70 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-4">
              <ImageCropper
                imageSrc={previewImage}
                onCropComplete={(croppedBlob) => {
                  const previewUrl = URL.createObjectURL(croppedBlob);
                  setPreviewImage(previewUrl);
                  const croppedFile = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
                  setValue('profilePicture', [croppedFile], { shouldDirty: true });
                  setCropMode(false);
                }}
                outputWidth={300}
                outputHeight={300}
                onCancel={() => {
                  setCropMode(false);
                  setPreviewImage(userData?.profilePicture || null);
                  setValue('profilePicture', null);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Modal */}
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl animate-slide-up mx-2 max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
            <button
              onClick={handleClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Container */}
          <div className="flex-grow overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
              {/* API Messages */}
              {apiError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{apiError}</span>
                </div>
              )}
              {apiSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{apiSuccess}</span>
                </div>
              )}
              
              {/* Profile Picture */}
              <div className="text-center">
                {/* ... existing JSX for Profile Picture Section ... */}
              </div>
              
              {/* Personal Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                {/* ... existing JSX for Personal Information inputs (Name, Email, etc.) ... */}
                {/* FIX: Corrected error key for Date of Birth */}
                {errors.dob && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.dob.message}
                  </p>
                )}
              </div>
              
              {/* Change Password Section */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                {/* ... existing JSX for Change Password Section, conditionally registering validation rules ... */}
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  {...register('oldPassword', changePassword ? validationRules.oldPassword : {})}
                  // ... rest of the props
                />
                {/* ... repeat for newPassword and confirmPassword ... */}
              </div>
            </form>
          </div>

          {/* Form Actions Footer */}
          <div className="flex-shrink-0 bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium text-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              disabled={isLoading || (!isDirty && !getValues('profilePicture'))}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : 'Update Profile'}
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isCloseModalOpen}
        title="Unsaved Changes"
        message="Are you sure you want to close? Your changes will be lost."
        onCancel={() => setCloseModalOpen(false)}
        onConfirm={() => {
          onClose();
          setCloseModalOpen(false);
        }}
        variant="destructive"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
      />
    </>
  );
};

export default EditProfileModal;