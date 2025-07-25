// src/components/doctor/EditProfileForm.jsx
import React, { useState, useCallback } from 'react';
import AxiosInstances from '../../apiManager';
import { toast } from 'react-hot-toast';
import useUserStore from '../../store/user';

export default function EditProfileForm({ initialData, onClose }) {
  // 1) Destructure once from the flattened shape
  const {
    name: initName,
    email,           // read-only
    phone,           // read-only
    specialization: initSpec,
    experience: initExp,
    hospital,
    fee: initFee,
    bio: initBio,
    profilePicture: initPicture = '',
  } = initialData;

  // 2) Single state object for the editable fields
  const [form, setForm] = useState({
    name:           initName || '',
    specialization: initSpec || '',
    experience:     initExp?.toString() || '',
    hospitalName:   hospital?.name || '',
    fee:            initFee?.toString() || '',
    bio:            initBio || '',
  });

  const [pictureFile, setPictureFile] = useState(null);
  const [preview, setPreview]         = useState(initPicture);
  const [loading, setLoading]         = useState(false);

  const {setUser}=useUserStore();

  // 3) Generic input handler
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // 4) File + preview
  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setPictureFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  // 5) Submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      // append all editable fields
      Object.entries(form).forEach(([k, v]) => {
        body.append(k, v);
      });
      // append new picture if provided
      if (pictureFile) {
        body.append('profilePicture', pictureFile);
      }

      const res=await AxiosInstances.put('/doctor/edit-profile', body);
      const updated = res.data.user;
+    setUser(updated);
      toast.success('Profile updated!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  }, [form, pictureFile, onClose]);

  return (
   <form onSubmit={handleSubmit} className="space-y-3">
  {/* Picture */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
    <img
      src={preview ||''}
      alt="Avatar preview"
      className="h-18 w-18 rounded-full object-cover border"
    />
    <div className="flex-1">
      <label className="block text-sm font-medium mb-1">
        Profile Picture
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="block w-full text-sm"
      />
    </div>
  </div>

  {/* 2-column grid on sm+, single column on xs */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium mb-1">Name</label>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        required
        className="w-full border rounded px-3 py-2"
      />
    </div>

    {/* Read‐only Email */}
    <div>
      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        value={email}
        disabled
        className="w-full bg-gray-100 border rounded px-3 py-2 text-gray-600"
      />
    </div>

    {/* Phone */}
    <div>
      <label className="block text-sm font-medium mb-1">Phone</label>
      <input
        value={phone}
        disabled
        className="w-full bg-gray-100 border rounded px-3 py-2 text-gray-600"
      />
    </div>

    {/* Specialization */}
    <div>
      <label className="block text-sm font-medium mb-1">Specialization</label>
      <input
        name="specialization"
        value={form.specialization}
        onChange={handleChange}
        required
        className="w-full border rounded px-3 py-2"
      />
    </div>
  </div>

  {/* Another 2-col grid for numeric fields */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium mb-1">Experience (yrs)</label>
      <input
        name="experience"
        type="number"
        min="0"
        value={form.experience}
        onChange={handleChange}
        required
        className="w-full border rounded px-3 py-2"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Consultation Fee</label>
      <input
        name="fee"
        type="number"
        min="0"
        value={form.fee}
        onChange={handleChange}
        required
        className="w-full border rounded px-3 py-2"
      />
    </div>
    <div>
  <label className="block text-sm font-medium mb-1">Hospital Name</label>
  <input
    name="hospitalName"
    type="text"
    value={form.hospitalName}
    disabled
    className="w-full bg-gray-100 text-gray-600 cursor-not-allowed border rounded px-3 py-2"
  />
</div>
  </div>

  {/* Bio full width */}
  <div>
    <label className="block text-sm font-medium mb-1">Bio</label>
    <textarea
      name="bio"
      rows={4}
      value={form.bio}
      onChange={handleChange}
      className="w-full border rounded px-3 py-2"
    />
  </div>

  {/* Actions: stack on xs, inline on sm+ */}
  <div className="flex flex-col sm:flex-row justify-end gap-3">
    <button
      type="button"
      onClick={onClose}
      disabled={loading}
      className="px-4 py-2 border rounded w-full sm:w-auto"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="px-6 py-2 bg-blue-600 text-white rounded w-full sm:w-auto disabled:opacity-50"
    >
      {loading ? 'Saving…' : 'Save'}
    </button>
  </div>
</form>

  );
}
