import React, { useState } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import AxiosInstances from '../../apiManager';

const AddHospitalModal = ({ isOpen, onClose, onAdded }) => {
  const [form, setForm] = useState({
    name: '',
    location: '',
    googleMapsLink: '',
    phoneNumber: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await AxiosInstances.post('/admin/add-hospital', form);
      toast.success('Hospital added');
      onAdded(); // refresh list
      onClose();
      setForm({ name: '', location: '', googleMapsLink: '', phoneNumber: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add hospital');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white max-w-lg mx-auto mt-24 p-6 rounded-lg shadow-lg outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Hospital</h2>

      <div className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Hospital Name" className="input-field" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="input-field" />
        <input name="googleMapsLink" value={form.googleMapsLink} onChange={handleChange} placeholder="Google Maps URL" className="input-field" />
        <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="Phone Number" className="input-field" />
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
      </div>
    </Modal>
  );
};

export default AddHospitalModal;
