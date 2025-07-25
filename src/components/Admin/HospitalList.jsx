import React, { useEffect, useState } from 'react';
import AxiosInstances from '../../apiManager';
import toast from 'react-hot-toast';
import EditHospitalModal from './EditHospitalModal';
import AddHospitalModal from './AddHospitalModal';

const HospitalList = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);

    const [editingHospital, setEditingHospital] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);

    const openEditModal = (hospital) => {
        setEditingHospital(hospital);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingHospital(null);
    };

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const res = await AxiosInstances.get('/admin/hospitals');
            setHospitals(res.data);
        } catch (err) {
            toast.error('Failed to fetch hospitals');
        } finally {
            setLoading(false);
        }
    };

    

    const handleDelete = async (id) => {
        const confirm = window.confirm("Are you sure you want to delete this hospital?");
        if (!confirm) return;

        try {
            await AxiosInstances.delete(`/admin/delete-hospital/${id}`);
            toast.success('Hospital deleted');
            fetchHospitals();
        } catch (err) {
            toast.error('Failed to delete hospital');
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Hospital Directory</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setAddModalOpen(true)}>
                    + Add Hospital
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {hospitals.map(hospital => (
                        <div key={hospital._id} className="bg-white rounded-xl shadow p-4 border">
                            <h3 className="text-lg font-semibold mb-2">{hospital.name}</h3>
                            <p className="text-sm text-gray-600 mb-1">📍 {hospital.location}</p>
                            <p className="text-sm text-gray-600 mb-1">📞 {hospital.phoneNumber}</p>
                            <p className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2
                                ${hospital.status === 'active' ? 'bg-green-100 text-green-700' :
                                    hospital.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
  onAdded={fetchHospitals}/>
          
            <EditHospitalModal
                isOpen={modalOpen}
                hospitalData={editingHospital}
                onClose={closeModal}
                onUpdate={fetchHospitals}
            />

            
        </div>
    );
};

export default HospitalList;
