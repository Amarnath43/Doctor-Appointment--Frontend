import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AxiosInstances from '../../apiManager';
import ConfirmationModal from '../../components/ConfirmationModal';
import { X, Loader2, AlertCircle, MapPin, Link2, Phone } from 'lucide-react';

const AddHospitalModal = ({ isOpen, onClose, onAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCloseConfirmOpen, setCloseConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: '',
      location: '',
      googleMapsLink: '',
      phoneNumber: '',
    },
    mode: 'onChange', // Validate on input change
  });

  // Reset the form whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      reset();
      setIsLoading(false);
      setCloseConfirmOpen(false);
    }
  }, [isOpen, reset]);

  const validationRules = {
    name: { required: 'Hospital name is required' },
    location: { required: 'Location is required' },
    phoneNumber: {
      pattern: {
        value: /^[6-9]{1}[0-9]{9}$/,
        message: 'Must be a valid 10-digit Indian number',
      },
    },
    googleMapsLink: {
      pattern: {
        value: /^(https?:\/\/)?(www\.)?(google\.com\/maps|maps\.app\.goo\.gl)\/.+$/,
        message: 'Please enter a valid Google Maps URL',
      },
    },
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await AxiosInstances.post('/admin/add-hospital', data);
      toast.success('Hospital added successfully');
      onAdded(); // Refresh the hospital list
      onClose(); // Close the modal
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add hospital');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isDirty && !isLoading) {
      setCloseConfirmOpen(true); // Show confirmation if there are unsaved changes
    } else {
      onClose(); // Close directly if no changes
    }
  };

  const executeClose = () => {
    setCloseConfirmOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800 text-white border-b border-gray-700">
            <h2 className="text-lg font-semibold">Add New Hospital</h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-white/70 hover:bg-white/10 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Hospital Name <span className="text-red-500">*</span></label>
              <input
                {...register('name', validationRules.name)}
                placeholder="e.g., Apollo Clinic"
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.name && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14}/>{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Location <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  {...register('location', validationRules.location)}
                  placeholder="Street, City"
                  className={`w-full px-3 py-2 border rounded-md text-sm ${errors.location ? 'border-red-400' : 'border-gray-300'}`}
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.location && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14}/>{errors.location.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Google Maps URL</label>
              <div className="relative">
                <input
                  {...register('googleMapsLink', validationRules.googleMapsLink)}
                  placeholder="https://maps.google.com/..."
                  className={`w-full px-3 py-2 border rounded-md text-sm ${errors.googleMapsLink ? 'border-red-400' : 'border-gray-300'}`}
                />
                <Link2 className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.googleMapsLink && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14}/>{errors.googleMapsLink.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <input
                  {...register('phoneNumber', validationRules.phoneNumber)}
                  placeholder="10-digit mobile number"
                  className={`w-full px-3 py-2 border rounded-md text-sm ${errors.phoneNumber ? 'border-red-400' : 'border-gray-300'}`}
                />
                <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.phoneNumber && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14}/>{errors.phoneNumber.message}</p>}
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Hospital'
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isCloseConfirmOpen}
        title="Unsaved Changes"
        message="Are you sure you want to close? Your changes will be lost."
        onCancel={() => setCloseConfirmOpen(false)}
        onConfirm={executeClose}
        variant="destructive"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
      />
    </>
  );
};

export default AddHospitalModal;
