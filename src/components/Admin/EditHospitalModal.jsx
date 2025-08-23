import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import AxiosInstances from '../../apiManager';
import {
  X, Loader2, AlertCircle, CheckCircle, Trash2, Upload as UploadIcon,
  Phone, MapPin, Link2, FileText, HeartPulse, Beaker, Building
} from 'lucide-react';
import ImageCropper from '../Cropper';
import ConfirmationModal from '../ConfirmationModal';

const MAX_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// URL -> "hospitals/..." (no leading slash)
const toBareS3Key = (s) => {
  try {
    const u = new URL(s);
    return decodeURIComponent(u.pathname.replace(/^\/+/, '')).split('?')[0].split('#')[0];
  } catch {
    return s.replace(/^\/+/, '').split('?')[0].split('#')[0];
  }
};
// URL or key -> DB key with leading slash: "/hospitals/..."
const toDbKey = (s) => `/${toBareS3Key(s)}`;

// helpers for cropper
const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const blobToFile = (blob, name, type = 'image/jpeg') => new File([blob], name, { type });

const EditHospitalModal = ({ isOpen, onClose, hospitalData, onUpdate }) => {
  const fileInputRef = useRef(null);

  // images = array of keys (DB keys or temp ids). DB keys look like "/hospitals/..."; temp ids look like "temp:uuid"
  const [images, setImages] = useState([]);
  // previewUrls = { [keyOrTempId]: url }
  const [previewUrls, setPreviewUrls] = useState({});

  // pendingUploads = files we will upload on Save only
  const [pendingUploads, setPendingUploads] = useState([]); // { id, name, blob, contentType, previewUrl }

  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [savePct, setSavePct] = useState(0);

  // cropper state
  const [cropping, setCropping] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [pendingFileName, setPendingFileName] = useState('upload.jpg');

  // Track original images (from server) to know which deletions need AWS cleanup on save
  const originalKeysRef = useRef(new Set());
  // Soft-deleted keys (removed in UI but not yet deleted in AWS). We'll process on Save.
  const [pendingDeletes, setPendingDeletes] = useState(new Set());

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
      status: 'pending',
      description: '',
      weekdayTimings: '',
      weekendTimings: '',
      departments: '',
      availableTests: '',
      facilities: '',
    },
    mode: 'onChange',
  });

  // hydrate from hospitalData (hospitalData.images can be public URLs or keys)
  useEffect(() => {
    if (!isOpen || !hospitalData) return;

    reset({
      name: hospitalData.name || '',
      location: hospitalData.location || '',
      googleMapsLink: hospitalData.googleMapsLink || '',
      phoneNumber: hospitalData.phoneNumber || '',
      status: hospitalData.status || 'pending',
      description: hospitalData.description || '',
      weekdayTimings: hospitalData.timings?.weekdays || '',
      weekendTimings: hospitalData.timings?.weekends || '',
      departments: (hospitalData.departments || []).join(', '),
      availableTests: (hospitalData.availableTests || []).join(', '),
      facilities: (hospitalData.facilities || []).join(', '),
    });

    const items = (hospitalData.images ?? []).filter(Boolean);
    const map = {};
    const keys = [];

    items.forEach((item) => {
      const key = toDbKey(item);
      const preview = /^https?:\/\//i.test(item) ? item : item;
      map[key] = preview;
      keys.push(key);
    });

    originalKeysRef.current = new Set(keys);
    setPendingDeletes(new Set());
    setPendingUploads([]);

    setPreviewUrls(map);
    setImages(keys);
    setApiError('');
    setApiSuccess('');
    setSavePct(0);
  }, [isOpen, hospitalData, reset]);

  const validation = {
    name: { required: 'Hospital name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } },
    location: { required: 'Location is required' },
    status: { required: 'Status is required' },
  };

  const onCloseSafely = () => {
  const hasUnsavedUploads = pendingUploads.length > 0;
  if ((isDirty || pendingDeletes.size > 0 || hasUnsavedUploads) && !saving) {
    setCloseConfirmOpen(true); // Just open the modal
  } else {
    onClose?.(); // Close directly if no changes
  }
};

  const handleChooseFile = () => fileInputRef.current?.click();

  // pick -> open cropper
  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setApiError('Unsupported file type');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setApiError(`Image must be under ${MAX_MB}MB`);
      return;
    }

    setApiError('');
    setApiSuccess('');

    const dataUrl = await fileToDataURL(file);
    setCropSrc(dataUrl);
    setPendingFileName(file.name || 'upload.jpg');
    setCropping(true);

    e.target.value = '';
  };

  const handleCropCancel = () => {
    setCropping(false);
    setCropSrc(null);
  };

  // crop done -> keep in memory only (upload on Save)
  const handleCropDone = async (croppedBlob) => {
    setCropping(false);
    setCropSrc(null);

    const file = blobToFile(croppedBlob, pendingFileName, 'image/jpeg');
    const id = `temp:${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    const previewUrl = URL.createObjectURL(file);

    setPendingUploads((prev) => [
      ...prev,
      { id, name: file.name, blob: file, contentType: file.type || 'image/jpeg', previewUrl },
    ]);

    setImages((prev) => [...prev, id]);
    setPreviewUrls((prev) => ({ ...prev, [id]: previewUrl }));
    setApiSuccess('Image added (will upload on Save)');
    setTimeout(() => setApiSuccess(''), 1200);
  };

  // Remove image (soft): for temp ids, drop memory; for real keys, mark pending delete
  const handleRemoveImage = (key) => {
    const isTemp = String(key).startsWith('temp:');

    setImages((prev) => prev.filter((k) => k !== key));
    setPreviewUrls((prev) => {
      const { [key]: _discard, ...rest } = prev;
      return rest;
    });

    if (isTemp) {
      setPendingUploads((prev) => {
        const item = prev.find((u) => u.id === key);
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((u) => u.id !== key);
      });
    } else if (originalKeysRef.current.has(key)) {
      setPendingDeletes((prev) => new Set(prev).add(key));
    }
  };

  // PUBLIC bucket upload; return array of DB keys to store (with leading "/")
  const uploadPendingFiles = async () => {
    if (pendingUploads.length === 0) return [];

    const uploadedKeys = [];
    for (let i = 0; i < pendingUploads.length; i++) {
      const item = pendingUploads[i];
      setSavePct(Math.round((i / pendingUploads.length) * 100));

      const { data: presigned } = await AxiosInstances.get('/uploads/public-presigned-upload-url', {
        params: { folder: 'hospitals', contentType: item.contentType },
      });
      
      await axios.put(presigned.uploadUrl, item.blob, {
        headers: { 'Content-Type': item.contentType },
      });

      const dbKey = toDbKey(presigned.key);
      uploadedKeys.push(dbKey);
    }

    setSavePct(100);
    return uploadedKeys;
  };

  const executeClose = () => {
  pendingUploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
  onClose?.();
  setCloseConfirmOpen(false);
};

  const onSubmit = async (formData) => {
    setSaving(true);
    setApiError('');
    setApiSuccess('');

    let uploadedKeys = [];

    try {
      uploadedKeys = await uploadPendingFiles();

      const keptRealKeys = images.filter((k) => !String(k).startsWith('temp:'));
      const finalImages = [...keptRealKeys, ...uploadedKeys];

      const payload = {
        name: formData.name,
        location: formData.location,
        googleMapsLink: formData.googleMapsLink,
        phoneNumber: formData.phoneNumber,
        status: formData.status,
        description: formData.description,
        images: finalImages,
        timings: {
          weekdays: formData.weekdayTimings || '',
          weekends: formData.weekendTimings || '',
        },
        departments: formData.departments.split(',').map(s => s.trim()).filter(Boolean),
        availableTests: formData.availableTests.split(',').map(s => s.trim()).filter(Boolean),
        facilities: formData.facilities.split(',').map(s => s.trim()).filter(Boolean),
      };

      await AxiosInstances.put(`/admin/update-hospital/${hospitalData._id}`, payload);

      if (pendingDeletes.size > 0) {
        const deleteCalls = Array.from(pendingDeletes).map((key) =>
          AxiosInstances.delete('/admin/delete-hospital-image', {
            data: { url: key, hospitalId: hospitalData._id },
          })
        );
        const results = await Promise.allSettled(deleteCalls);
        const failures = results.filter((r) => r.status === 'rejected').length;
        if (failures > 0) {
          setApiError(`Saved, but ${failures} image${failures > 1 ? 's' : ''} could not be deleted from storage.`);
        }
      }

      pendingUploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
      setPendingUploads([]);
      setPendingDeletes(new Set());
      originalKeysRef.current = new Set(finalImages);

      setApiSuccess('Hospital updated');
      onUpdate?.();
      setTimeout(() => onClose?.(), 800);
    } catch (err) {
      if (uploadedKeys.length) {
        await Promise.allSettled(
          uploadedKeys.map((key) =>
            AxiosInstances.delete('/admin/delete-hospital-image', {
              data: { url: key, hospitalId: hospitalData?._id },
            })
          )
        );
      }
      setApiError(err?.response?.data?.message || 'Validation or update failed');
    } finally {
      setSaving(false);
      setSavePct(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseSafely} />

      {/* modal */}
      <div className="relative w-full max-w-4xl mx-auto my-6 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* header */}
        <div className="bg-gray-800 px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-white">Edit Hospital</h2>
            <button
              onClick={onCloseSafely}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              disabled={saving}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
            {/* alerts */}
            {apiError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span className="text-xs sm:text-sm">{apiError}</span>
              </div>
            )}
            {apiSuccess && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-4 h-4 mt-0.5" />
                <span className="text-xs sm:text-sm">{apiSuccess}</span>
              </div>
            )}

            {/* basic info */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Hospital Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    {...register('name', validation.name)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="e.g., Apollo Clinic"
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Location <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register('location', validation.location)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${errors.location ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="Street, city"
                    />
                    <MapPin className="w-4 h-4 text-gray-400 absolute right-2 top-2.5" />
                  </div>
                  {errors.location && <p className="text-xs text-red-600">{errors.location.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Google Maps Link</label>
                  <div className="relative">
                    <input
                      type="url"
                      {...register('googleMapsLink')}
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="https://maps.google.com/..."
                    />
                    <Link2 className="w-4 h-4 text-gray-400 absolute right-2 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Phone</label>
                  <div className="relative">
                    <input
                      type="tel"
                      {...register('phoneNumber')}
                      className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="+91 98765 43210"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute right-2 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
                  <select
                    {...register('status', validation.status)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 ${errors.status ? 'border-red-300' : 'border-gray-200'}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  {errors.status && <p className="text-xs text-red-600">{errors.status.message}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Describe the hospital..."
                  />
                </div>
              </div>
            </div>

            {/* Services & Facilities */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-gray-600" />
                Services & Facilities
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Departments</label>
                  <textarea
                    {...register('departments')}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., Cardiology, Neurology, Orthopedics"
                  />
                  <p className="text-[11px] text-gray-500">Enter comma-separated values.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Available Tests</label>
                  <textarea
                    {...register('availableTests')}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., MRI Scan, Blood Test, X-Ray"
                  />
                  <p className="text-[11px] text-gray-500">Enter comma-separated values.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Facilities</label>
                  <textarea
                    {...register('facilities')}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="e.g., 24/7 Emergency, Pharmacy, ICU"
                  />
                  <p className="text-[11px] text-gray-500">Enter comma-separated values.</p>
                </div>
              </div>
            </div>

            {/* images */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Images</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleChooseFile}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 text-xs sm:text-sm"
                    disabled={saving}
                  >
                    <UploadIcon className="w-4 h-4" />
                    Add Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilePicked}
                  />
                </div>
              </div>

              {saving && (
                <div className="mt-2">
                  <div className="h-2 w-full bg-gray-200 rounded">
                    <div className="h-2 bg-gray-800 rounded transition-all" style={{ width: `${savePct}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{savePct}%</p>
                </div>
              )}

              {Object.keys(previewUrls).length ? (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(previewUrls).map(([key, url]) => (
                    <div key={key} className="relative group">
                      <img
                        src={url}
                        alt="hospital"
                        className="w-full h-28 object-cover rounded-lg border border-gray-200"
                        onError={(e) => { e.currentTarget.src = '/default-hospital.png'; }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(key)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 hover:bg-white rounded-full shadow text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {String(key).startsWith('temp:') && (
                        <span className="absolute left-1.5 bottom-1.5 text-[10px] px-1.5 py-0.5 bg-white/90 rounded border border-gray-200">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2">No images added.</p>
              )}

              <p className="text-[11px] text-gray-500 mt-2">Allowed: JPG, PNG, WebP, GIF, AVIF. Max {MAX_MB}MB. New images are uploaded on Save.</p>
            </div>
          </form>
        </div>

        {/* footer */}
        <div className="bg-gray-50 px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-200">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onCloseSafely}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-xs sm:text-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* cropper overlay */}
      {cropping && cropSrc && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center">
          <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl">
            <ImageCropper
              imageSrc={cropSrc}
              outputWidth={1200}
              outputHeight={800}
              onCropComplete={handleCropDone}
              onCancel={handleCropCancel}
            />
          </div>
        </div>
      )}

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
    </div>
  );
};

export default EditHospitalModal;
