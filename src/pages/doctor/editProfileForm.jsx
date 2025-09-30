import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import AxiosInstances from '../../apiManager';
import useUserStore from '../../store/user';
import { X, Camera, Lock, Eye, EyeOff, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import ImageCropper from '../../components/Cropper';

const EditProfileForm = ({ initialData, onClose, onProfileUpdated }) => {
  const { name, specialization } = initialData;

  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(initialData?.profilePicture || null);
  const [changePassword, setChangePassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [isCloseModalOpen, setCloseModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const { setUser } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
    getValues
  } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      specialization: initialData?.specialization || '',
      experience: initialData?.experience || '',
      fee: initialData?.fee || '',
      bio: initialData?.bio || '',
      profilePicture: null,
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // BUG FIX 3: Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        specialization: initialData.specialization || '',
        experience: initialData.experience || '',
        fee: initialData.fee || '',
        bio: initialData.bio || '',
      });
      setPreviewImage(initialData.profilePicture || null);
      setChangePassword(false);
    }
  }, [initialData, reset]);

  const validationRules = {
    oldPassword: { required: 'Current password is required' },
    newPassword: {
      required: 'New password is required',
      minLength: { value: 6, message: 'Password must be at least 6 characters' }
    },
    confirmPassword: {
      required: 'Please confirm your new password',
      validate: (value) => value === watch('newPassword') || 'Passwords do not match'
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return; }
      if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setCropMode(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemovePicture = () => {
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setValue('profilePicture', undefined, { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data) => {
    const profilePictureFile = getValues('profilePicture');
    if (!isDirty && !profilePictureFile) {
      toast('No changes to save.', { icon: '🤷' });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        name: data.name,
        specialization: data.specialization,
        experience: data.experience,
        fee: data.fee,
        bio: data.bio
      };

      if (profilePictureFile && profilePictureFile[0]) {
        const file = profilePictureFile[0];
        const { data: presigned } = await AxiosInstances.get('/uploads/public-presigned-upload-url', {
          params: { folder: 'doctors', contentType: file.type }
        });
        await fetch(presigned.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        payload.profilePicture = presigned.key;
      } else if (!previewImage && initialData.profilePicture) {
        payload.profilePicture = ''; // Image was removed
      }

      if (changePassword) {
        payload.changePassword = true;
        payload.oldPassword = data.oldPassword;
        payload.newPassword = data.newPassword;
      }

      const response = await AxiosInstances.put('/doctor/edit-profile', payload);
      const newData = response.data.user;
      
      setUser(newData);
      toast.success('Profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated(newData);
      
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error('Update Profile Error:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    const profilePictureFile = getValues('profilePicture');
    if ((isDirty || profilePictureFile) && !isLoading) {
      setCloseModalOpen(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {cropMode && typeof previewImage === 'string' && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-4">
            <ImageCropper
              imageSrc={previewImage}
              onCropComplete={(croppedBlob) => {
                if (previewImage && previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
                const previewUrl = URL.createObjectURL(croppedBlob);
                setPreviewImage(previewUrl);
                const croppedFile = new File([croppedBlob], 'cropped-image.jpeg', { type: 'image/jpeg' });
                setValue('profilePicture', [croppedFile], { shouldDirty: true });
                setCropMode(false);
              }}
              outputWidth={300}
              outputHeight={300}
              onCancel={() => {
                setCropMode(false);
                setPreviewImage(initialData?.profilePicture || null);
                setValue('profilePicture', null);
              }}
            />
          </div>
        </div>
      )}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}/>
      <div className="relative flex flex-col max-h-[95vh] w-full max-w-4xl animate-slide-up overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex-shrink-0 px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-800">
          <h2 className="text-md font-semibold text-white">Edit Profile</h2>
          <button onClick={handleClose} disabled={isLoading} className="text-white p-1 rounded-full hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
          <div className="flex-grow space-y-5 overflow-y-auto p-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Profile Picture</h3>
              <div className="relative inline-block h-24 w-24">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full rounded-full object-cover border" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border">
                    <span className="text-gray-500 text-2xl font-semibold">{name?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <input type="file" accept="image/*" id="profilePicture" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                {/* BUG FIX 2: Conditional "Add"/"Replace" text */}
                <label htmlFor="profilePicture" className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50">
                  <Camera className="h-4 w-4" />
                  {previewImage ? 'Replace' : 'Add Photo'}
                </label>
                {previewImage && (
                  <button type="button" onClick={handleRemovePicture} className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Full Name</label>
                <input {...register('name', { required: 'Name is required' })} className="w-full px-2 py-1.5 border rounded-md text-sm" />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Specialization</label>
                <input {...register('specialization', { required: 'Specialization is required' })} className="w-full px-2 py-1.5 border rounded-md text-sm" />
                {errors.specialization && <p className="text-xs text-red-600 mt-1">{errors.specialization.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Experience (years)</label>
                <input type="number" {...register('experience', { required: 'Experience is required' })} className="w-full px-2 py-1.5 border rounded-md text-sm" />
                {errors.experience && <p className="text-xs text-red-600 mt-1">{errors.experience.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Consultation Fee</label>
                <input type="number" {...register('fee', { required: 'Fee is required' })} className="w-full px-2 py-1.5 border rounded-md text-sm" />
                {errors.fee && <p className="text-xs text-red-600 mt-1">{errors.fee.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Bio</label>
              <textarea {...register('bio')} rows={2} className="w-full px-2 py-1.5 border rounded-md text-sm" />
            </div>

            <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <input type="checkbox" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} id="changePassword" className="w-3 h-3 text-gray-600 border-gray-300 rounded focus:ring-gray-500"/>
                <label htmlFor="changePassword" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <Lock className="w-3 h-3 text-gray-500" /> Change Password
                </label>
              </div>
              {changePassword && (
                <div className="space-y-3 pl-5 border-l-2 border-yellow-200">
                  {/* Password fields here... */}
                </div>
              )}
            </div>
          </div>

          {/* BUG FIX 1: Sticky footer for mobile visibility */}
          <div className="flex-shrink-0 sticky bottom-0 z-10 flex justify-end gap-3 p-4 bg-white/90 border-t border-gray-200 backdrop-blur-sm">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={isLoading || (!isDirty && !getValues('profilePicture'))}>
              {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin"/> Saving...</>) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <ConfirmationModal
        isOpen={isCloseModalOpen}
        title="Unsaved Changes"
        message="Are you sure you want to close? Your changes will be lost."
        onCancel={() => setCloseModalOpen(false)}
        onConfirm={() => { onClose(); setCloseModalOpen(false); }}
        variant="destructive"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
      />
    </div>
  );
};

export default EditProfileForm;

