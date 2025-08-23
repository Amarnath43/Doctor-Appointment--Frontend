import React, { useEffect, useState } from 'react';
import AxiosInstances from '../../apiManager';
import toast from 'react-hot-toast';
import EditHospitalModal from './EditHospitalModal';
import AddHospitalModal from './AddHospitalModal';
import ConfirmationModal from '../../components/ConfirmationModal'; // Assuming this is the correct path
import { ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';

/** Build a public S3 URL from a key. */
const makePublicUrlFromKey = (key) => {
  if (!key) return '';
  if (/^https?:\/\//i.test(key)) return key;

  const bucket = import.meta.env.VITE_AWS_PUBLIC_BUCKET;
  const region = import.meta.env.VITE_AWS_PUBLIC_REGION || import.meta.env.VITE_AWS_REGION || 'ap-south-1';
  const encodedKey = encodeURI(key).replace(/#/g, '%23');
  const host =
    region === 'us-east-1'
      ? `https://${bucket}.s3.amazonaws.com`
      : `https://${bucket}.s3.${region}.amazonaws.com`;

  return `${host}/${encodedKey.replace(/^\/+/, '')}`;
};

/** Normalize backend images (array of keys or urls) into public URLs */
const normalizeimages = (images) =>
  (Array.isArray(images) ? images : [])
    .map(makePublicUrlFromKey)
    .filter(Boolean);

/* --- ImageSlider: expects an array of PUBLIC URLs --- */
const ImageSlider = ({
  images = [],
  auto = true,
  intervalMs = 3000,
  pauseOnHover = true,
}) => {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (idx >= images.length && images.length) setIdx(0);
  }, [images, idx]);

  useEffect(() => {
    if (!auto || images.length <= 1) return;
    if (pauseOnHover && hovered) return;

    const id = setInterval(() => {
      setIdx((p) => (p + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(id);
  }, [auto, images, hovered, intervalMs, pauseOnHover]);

  if (!images.length) {
    return (
      <div className="w-full h-40 bg-gray-100 rounded-md grid place-items-center text-gray-400 text-sm">
        No images
      </div>
    );
  }

  const prev = () => setIdx((p) => (p - 1 + images.length) % images.length);
  const next = () => setIdx((p) => (p + 1) % images.length);

  return (
    <div
      className="relative w-full h-40 overflow-hidden rounded-md border border-gray-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={images[idx]}
        alt="hospital"
        className="w-full h-full object-cover"
        onError={(e) => { e.currentTarget.src = '/default-hospital.png'; }}
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === idx ? 'bg-white' : 'bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const HospitalList = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingHospital, setEditingHospital] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deletingHospitalId, setDeletingHospitalId] = useState(null); // State for delete confirmation

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstances.get('/admin/hospitals');
      const list = Array.isArray(res.data) ? res.data : [];

      const withUrls = list.map((h) => ({
        ...h,
        _images: normalizeimages(h.images || []),
      }));

      setHospitals(withUrls);
    } catch (err) {
      toast.error('Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const openEditModal = (hospital) => {
    setEditingHospital({ ...hospital, images: hospital._images });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingHospital(null);
  };

  const handleDelete = (id) => {
    // Open the confirmation modal instead of deleting directly
    setDeletingHospitalId(id);
  };

  const executeDelete = async () => {
    if (!deletingHospitalId) return;
    try {
      await AxiosInstances.delete(`/admin/delete-hospital/${deletingHospitalId}`);
      toast.success('Hospital deleted');
      fetchHospitals(); // Refresh the list
    } catch {
      toast.error('Failed to delete hospital');
    } finally {
      setDeletingHospitalId(null); // Close the modal
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Hospital Directory</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => setAddModalOpen(true)}
        >
          + Add Hospital
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      <p className="mt-4 text-gray-600 font-medium">Error Loading Data...</p>
    </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospitals.map((hospital) => (
            <div key={hospital._id} className="bg-white rounded-xl shadow p-4 border">
              <div className="mb-3">
                <ImageSlider images={hospital._images} />
              </div>

              <h3 className="text-lg font-semibold mb-2">{hospital.name}</h3>
              <p className="text-sm text-gray-600 mb-1">📍 {hospital.location}</p>
              <p className="text-sm text-gray-600 mb-1">📞 {hospital.phoneNumber}</p>
              <p
                className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2
                  ${hospital.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : hospital.status === 'blocked'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'}`}
              >
                {hospital.status}
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleDelete(hospital._id)}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => openEditModal(hospital)}
                  className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddHospitalModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdded={fetchHospitals}
      />

      {editingHospital && (
        <EditHospitalModal
          key={editingHospital._id}
          isOpen={modalOpen}
          hospitalData={editingHospital}
          onClose={closeModal}
          onUpdate={fetchHospitals}
        />
      )}

      <ConfirmationModal
        isOpen={!!deletingHospitalId}
        title="Confirm Deletion"
        message="Are you sure you want to delete this hospital? This action cannot be undone."
        onCancel={() => setDeletingHospitalId(null)}
        onConfirm={executeDelete}
        variant="destructive"
        confirmText="Delete"
        cancelText="Cancel"
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
      />
    </div>
  );
};

export default HospitalList;
