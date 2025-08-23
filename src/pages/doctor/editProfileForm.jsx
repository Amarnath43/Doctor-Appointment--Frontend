import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AxiosInstances from '../../apiManager';
import { toast } from 'react-hot-toast';
import useUserStore from '../../store/user';
import { X, Camera, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import ImageCropper from '../../components/Cropper';

const EditProfileForm = ({ initialData, onClose, onProfileUpdated }) => {
  const { name, email, phone, profilePicture, specialization, experience, fee, bio } = initialData;

  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(profilePicture || null);
  const [changePassword, setChangePassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [isCloseModalOpen, setCloseModalOpen] = useState(false);
  

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
      name: name || '',
      specialization: specialization || '',
      experience: experience || '',
      fee: fee || '',
      bio: bio || '',
      profilePicture: null,
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Clean up blob URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

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
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
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
        const contentType = file.type;

        const { data: presigned } = await AxiosInstances.get('/uploads/public-presigned-upload-url', {
          params: { folder: 'doctors', contentType }
        });

        await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file
        });

        payload.profilePicture = presigned.key;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {cropMode && typeof previewImage === 'string' && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-4">
            <ImageCropper
              imageSrc={previewImage}
              onCropComplete={(croppedBlob) => {
                if (previewImage && previewImage.startsWith('blob:')) {
                  URL.revokeObjectURL(previewImage);
                }
                const previewUrl = URL.createObjectURL(croppedBlob);
                setPreviewImage(previewUrl);
                const croppedFile = new File([croppedBlob], 'cropped-image.jpeg', { type: croppedBlob.type });
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
      <div className="relative max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-800 flex-shrink-0">
          <h2 className="text-md font-semibold text-white">Edit Profile</h2>
          <button onClick={handleClose} disabled={isLoading} className="text-white p-1 rounded-full hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
          <div className="text-center">
             <h3 className="text-sm font-medium text-gray-700 mb-2">Profile Picture</h3>
             <div className="relative inline-block">
               {previewImage ? (
                 <img src={previewImage} alt="Preview" className="w-20 h-20 rounded-full object-cover border" />
               ) : (
                 <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border">
                   <span className="text-gray-500 text-xl">{name?.charAt(0).toUpperCase()}</span>
                 </div>
               )}
               <label htmlFor="profilePicture" className="absolute bottom-0 right-0 bg-gray-700 text-white p-1 rounded-full cursor-pointer hover:bg-gray-600">
                 <Camera className="w-4 h-4" />
               </label>
               <input type="file" accept="image/*" id="profilePicture" onChange={handleFileChange} className="hidden" />
             </div>
             <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-medium text-gray-700">Full Name</label>
               <input {...register('name', { required: 'Name is required' })} className="w-full px-2 py-1.5 border rounded-md text-sm" />
               {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
             </div>
             <div>
               <label className="text-xs font-medium text-gray-700">Email</label>
               <input value={email} disabled className="w-full px-2 py-1.5 border bg-gray-100 text-gray-500 rounded-md text-sm" />
             </div>
             <div>
               <label className="text-xs font-medium text-gray-700">Phone</label>
               <input value={phone} disabled className="w-full px-2 py-1.5 border bg-gray-100 text-gray-500 rounded-md text-sm" />
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
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                   <div className="space-y-1.5 lg:col-span-2">
                     <label className="text-xs font-medium text-gray-700">Current Password <span className="text-red-500">*</span></label>
                     <div className="relative">
                       <input
                         type={showOldPassword ? 'text' : 'password'}
                         {...register('oldPassword', changePassword ? validationRules.oldPassword : {})}
                         className={`w-full px-2 py-1.5 pr-10 border rounded-md text-xs sm:text-sm ${errors.oldPassword ? 'border-red-300' : 'border-gray-200'}`}
                         placeholder="Enter your current password"
                       />
                       <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600">
                         {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                     </div>
                     {errors.oldPassword && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.oldPassword.message}</p>}
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-medium text-gray-700">New Password <span className="text-red-500">*</span></label>
                     <div className="relative">
                       <input
                         type={showNewPassword ? 'text' : 'password'}
                         {...register('newPassword', changePassword ? validationRules.newPassword : {})}
                         className={`w-full px-2 py-1.5 pr-10 border rounded-md text-xs sm:text-sm ${errors.newPassword ? 'border-red-300' : 'border-gray-200'}`}
                         placeholder="Enter new password"
                       />
                       <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600">
                         {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                     </div>
                     {errors.newPassword && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.newPassword.message}</p>}
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-medium text-gray-700">Confirm New Password <span className="text-red-500">*</span></label>
                     <div className="relative">
                       <input
                         type={showConfirmPassword ? 'text' : 'password'}
                         {...register('confirmPassword', changePassword ? validationRules.confirmPassword : {})}
                         className={`w-full px-2 py-1.5 pr-10 border rounded-md text-xs sm:text-sm ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`}
                         placeholder="Confirm new password"
                       />
                       <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600">
                         {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                     </div>
                     {errors.confirmPassword && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword.message}</p>}
                   </div>
                 </div>
               </div>
             )}
           </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-100 transition-colors" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={isLoading || (!isDirty && !getValues('profilePicture'))}>
              {isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
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
    </div>
  );
};

export default EditProfileForm;