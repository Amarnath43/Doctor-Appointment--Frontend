import { useState, useEffect, useRef } from 'react';
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
  CheckCircle,
  Trash2
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

  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      dob: userData?.dob ? userData.dob.split('T')[0] : '',
      gender: userData?.gender || 'Male',
      bloodGroup: userData?.bloodGroup || 'O+',
      address: userData?.address || '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      profilePicture: undefined
    },
    shouldUnregister: true
  });

  const watchNewPassword = watch('newPassword');

  const validationRules = {
    name: {
      required: 'Name is required',
      minLength: { value: 4, message: 'Name must be at least 4 characters' }
    },
    dob: {
      required: 'Date of birth is required',
      validate: (value) => {
        const today = new Date();
        const birthDate = new Date(value);
        if (isNaN(birthDate.getTime())) return 'Invalid date';
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 0 || age > 120) return 'Please enter a valid date of birth';
        return true;
      }
    },
    gender: { required: 'Please select a gender' },
    bloodGroup: { required: 'Please select a blood group' },
    address: {
      required: 'Address is required',
      minLength: { value: 10, message: 'Address must be at least 10 characters' }
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

  // Reset when open
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
        confirmPassword: '',
        profilePicture: undefined
      }, { keepDirty: false });

      setPreviewImage(userData.profilePicture || null);
      setChangePassword(false);
      setApiError('');
      setApiSuccess('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen, userData, reset]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (previewImage && typeof previewImage === 'string' && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
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
        if (previewImage && previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
        setPreviewImage(reader.result);
        setCropMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    if (previewImage && previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setValue('profilePicture', undefined, { shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data) => {
    if (isLoading) return;
    setIsLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      let uploadedKey = '';
      const files = getValues('profilePicture');

      if (files && files.length > 0) {
        const file = files[0];
        const contentType = file.type;

        const { data: presigned } = await AxiosInstances.get(
          `/uploads/public-presigned-upload-url`,
          { params: { folder: 'users', contentType } }
        );

        const putRes = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file
        });
        if (!putRes.ok) throw new Error(`Image upload failed (${putRes.status})`);
        uploadedKey = presigned.key;
      } else if (userData?.profilePicture) {
        try {
          const url = new URL(userData.profilePicture);
          const pathname = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
          uploadedKey = pathname;
        } catch {
          uploadedKey = userData.profilePicture;
        }
      } else {
        uploadedKey = '';
      }

      const payload = {
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        address: data.address,
        profilePicture: uploadedKey
      };

      if (changePassword) {
        payload.changePassword = true;
        payload.oldPassword = data.oldPassword;
        payload.newPassword = data.newPassword;
      }

      const response = await AxiosInstances.put('/user/edit-profile', payload);
      const newData = response.data.user;

      setApiSuccess('Profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated(newData);

      reset({
        name: newData?.name || '',
        email: newData?.email || '',
        phone: newData?.phone || '',
        dob: newData?.dob ? newData.dob.split('T')[0] : '',
        gender: newData?.gender || 'Male',
        bloodGroup: newData?.bloodGroup || 'O+',
        address: newData?.address || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        profilePicture: undefined
      }, { keepDirty: false });

      setPreviewImage(newData?.profilePicture || null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('Profile update failed:', err);
      setApiError(err?.response?.data?.message || err?.message || 'Something went wrong while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    const files = getValues('profilePicture');
    const hasNewPicture = !!files && files.length > 0;
    if ((isDirty || hasNewPicture) && !isLoading) {
      setCloseModalOpen(true);
    } else {
      onClose();
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);

  if (!isOpen) return null;

  // helper classes (UI only)
  const inputBase =
    'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 ' +
    'focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition';
  const labelBase = 'flex items-center gap-2 text-sm font-medium text-gray-700';
  const sectionCard = 'rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm';

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex min-h-screen items-center justify-center p-2 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={handleClose}
        />

        {/* Cropper Modal */}
        {cropMode && previewImage && (
          <div className="fixed inset-0 z-[51] bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
              <div className="mb-2 text-sm font-semibold text-gray-800">Adjust your picture</div>
              <ImageCropper
                imageSrc={previewImage}
                onCropComplete={(croppedBlob) => {
                  if (previewImage && previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
                  const previewUrl = URL.createObjectURL(croppedBlob);
                  setPreviewImage(previewUrl);
                  const croppedFile = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
                  setValue('profilePicture', [croppedFile], { shouldDirty: true });
                  setCropMode(false);
                }}
                outputWidth={300}
                outputHeight={300}
                onCancel={() => {
                  if (previewImage && previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
                  setCropMode(false);
                  setPreviewImage(userData?.profilePicture || null);
                  setValue('profilePicture', undefined, { shouldDirty: false });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />
            </div>
          </div>
        )}

        {/* Main Modal */}
        <div className="relative mx-2 flex max-h-[95vh] w-full max-w-4xl animate-slide-up flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          {/* Header (sticky) */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 sm:px-6 backdrop-blur">
            <div>
              <h2 id="edit-profile-title" className="text-base font-semibold text-gray-900">Edit Profile</h2>
              <p className="text-xs text-gray-500">Update your info and profile image</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              disabled={isLoading}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scroll Area */}
          <div className="flex-grow overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-5">
            {/* Alerts */}
            {apiError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-sm">{apiError}</span>
              </div>
            )}
            {apiSuccess && (
              <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-sm">{apiSuccess}</span>
              </div>
            )}

            {/* Profile Image */}
            <div className={sectionCard}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Profile picture</div>
                  <p className="text-xs text-gray-500">PNG or JPG up to 5MB</p>
                </div>
              </div>

              <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                <div className="mx-auto h-28 w-28 overflow-hidden rounded-full ring-2 ring-gray-200">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : userData?.profilePicture ? (
                    <img src={userData.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-semibold text-gray-500">
                      {getInitials(userData?.name || 'U')}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50">
                    <Camera className="h-4 w-4" />
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      {...register('profilePicture')}
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </label>

                  {(previewImage || userData?.profilePicture) && (
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className={sectionCard}>
              <div className="mb-3 text-sm font-semibold text-gray-900">Personal information</div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelBase}><User className="h-4 w-4" /> Name</label>
                  <input className={`${inputBase} ${errors.name ? 'border-red-300 ring-red-100' : ''}`} {...register('name', validationRules.name)} placeholder="Full name" />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className={labelBase}><Mail className="h-4 w-4" /> Email</label>
                  <input className={`${inputBase} bg-gray-100 text-gray-600`} {...register('email')} readOnly />
                </div>

                <div>
                  <label className={labelBase}><Phone className="h-4 w-4" /> Phone</label>
                  <input className={inputBase} {...register('phone')} placeholder="Phone number" />
                </div>

                <div>
                  <label className={labelBase}><Calendar className="h-4 w-4" /> Date of Birth</label>
                  <input type="date" className={`${inputBase} ${errors.dob ? 'border-red-300 ring-red-100' : ''}`} {...register('dob', validationRules.dob)} />
                  {errors.dob && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dob.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelBase}><MapPin className="h-4 w-4" /> Address</label>
                  <textarea rows={3} className={`${inputBase} ${errors.address ? 'border-red-300 ring-red-100' : ''}`} {...register('address', validationRules.address)} placeholder="Street, City, State" />
                  {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select className={inputBase} {...register('gender', validationRules.gender)}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Blood Group</label>
                  <select className={inputBase} {...register('bloodGroup', validationRules.bloodGroup)}>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  {errors.bloodGroup && <p className="mt-1 text-xs text-red-600">{errors.bloodGroup.message}</p>}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className={sectionCard}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Lock className="h-4 w-4" /> Change password
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="rounded border-gray-300" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} />
                  Enable
                </label>
              </div>

              {changePassword && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className={inputBase + ' pr-9'}
                        {...register('oldPassword', validationRules.oldPassword)}
                        placeholder="Current password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
                        onClick={() => setShowOldPassword(v => !v)}
                        aria-label="Toggle current password visibility"
                      >
                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.oldPassword && <p className="mt-1 text-xs text-red-600">{errors.oldPassword.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className={inputBase + ' pr-9'}
                        {...register('newPassword', validationRules.newPassword)}
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
                        onClick={() => setShowNewPassword(v => !v)}
                        aria-label="Toggle new password visibility"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={inputBase + ' pr-9'}
                        {...register('confirmPassword', validationRules.confirmPassword)}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer (sticky) */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white/90 px-4 py-3 sm:px-6 backdrop-blur">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || (!isDirty && !(getValues('profilePicture') || []).length)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
