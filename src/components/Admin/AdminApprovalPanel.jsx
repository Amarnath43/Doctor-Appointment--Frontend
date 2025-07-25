import React, { useEffect, useState } from 'react';
import {
    Users,
    Building2,
    UserCheck,
    UserX,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    Stethoscope,
    Loader2,
    Activity
} from 'lucide-react';
import AxiosInstances from '../../apiManager/index'
import toast from 'react-hot-toast';

const AdminApprovalPanel = () => {
    const [activeTab, setActiveTab] = useState('doctors');
    const [doctors, setDoctors] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const res = await AxiosInstances.get('/admin/pendingdoctors');
            setDoctors(res.data);
        } catch (error) {
            console.error('Failed to fetch doctors', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHospitals = async () => {
        try {
            setLoading(true);
            const res = await AxiosInstances.get('/admin/pending-hospitals');
            setHospitals(res.data);
            console.log(res.data)
        } catch (error) {
            console.error('Failed to fetch hospitals', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
  fetchDoctors();
  fetchHospitals();
}, []);

    const toggleDoctorStatus = async (id, status) => {
        try {
            await AxiosInstances.patch(`/admin/updatedoctorstatus/${id}`, { status });
            fetchDoctors();
            toast.success(`Status of Doctor updated to ${status}`)
        } catch (err) {
            console.error('Error updating doctor status', err);
        }
    };

    const toggleHospitalStatus = async (id, status) => {
        try {
            await AxiosInstances.patch(`/admin/updateHospitalstatus/${id}`, { status });
            fetchHospitals();
            toast(`Status of Hospital updated to ${status}`)
        } catch (err) {
            console.error('Error updating hospital status', err);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-success" />;
            case 'blocked':
                return <XCircle className="h-4 w-4 text-destructive" />;
            default:
                return <Clock className="h-4 w-4 text-warning" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'text-success';
            case 'blocked':
                return 'text-destructive';
            default:
                return 'text-warning';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5">
            <div className="max-w-6xl mx-auto">
                {/* Header */}

                <p className="text-muted-foreground text-lg text-center mb-2">
                    Manage and approve healthcare providers
                </p>


                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="bg-card rounded-xl  shadow-card border border-border/50 flex flex-col sm:flex-row">
                        <button
                            className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
                ${activeTab === 'doctors'
                                    ? 'bg-gradient-primary text-primary-foreground shadow-elevated transform scale-105'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                }
              `}
                            onClick={() => setActiveTab('doctors')}
                        >
                            <Users className="h-5 w-5" />
                            Doctors
                            {doctors.length > 0 && (
                                <span className={`
                  ml-2 px-2 py-1 text-xs rounded-full
                  ${activeTab === 'doctors' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'}
                `}>
                                    {doctors.length}
                                </span>
                            )}
                        </button>
                        <button
                            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300
                ${activeTab === 'hospitals'
                                    ? 'bg-gradient-primary text-primary-foreground shadow-elevated transform scale-105'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                }
              `}
                            onClick={() => setActiveTab('hospitals')}
                        >
                            <Building2 className="h-5 w-5" />
                            Hospitals
                            {hospitals.length > 0 && (
                                <span className={`
                  ml-2 px-2 py-1 text-xs rounded-full
                  ${activeTab === 'hospitals' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'}
                `}>
                                    {hospitals.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-lg text-muted-foreground">Loading data...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Doctors Tab */}
                        {activeTab === 'doctors' && (
                            <div className="space-y-4">
                                {doctors.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No doctors to review</h3>
                                        <p className="text-muted-foreground">All doctors have been processed.</p>
                                    </div>
                                ) : (
                                    doctors.map((doc) => (
                                        <div
                                            key={doc._id}
                                            className="bg-card rounded-xl p-6 shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 group"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    {/* Doctor Header */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                                                            <Users className="h-6 w-6 text-primary-foreground" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                {doc.userId?.name}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Stethoscope className="h-4 w-4" />
                                                                <span className="text-sm">{doc.specialization}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Doctor Details */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Building2 className="h-4 w-4 text-primary" />
                                                            <span>
                                                                <span className="font-medium">Hospital:</span> {doc.hospital?.name || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <MapPin className="h-4 w-4 text-primary" />
                                                            <span>
                                                                <span className="font-medium">Location:</span> {doc.hospital?.location || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(doc.status)}
                                                        <span className="text-sm font-medium">Status:</span>
                                                        <span className={`text-sm font-semibold capitalize ${getStatusColor(doc.status)}`}>
                                                            {doc.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-3 lg:flex-col lg:min-w-[140px]">
                                                    <button
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                                                        onClick={() => toggleDoctorStatus(doc._id, 'active')}
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                        Activate
                                                    </button>
                                                    <button
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-700 font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                                                        onClick={() => toggleDoctorStatus(doc._id, 'blocked')}
                                                    >
                                                        <UserX className="h-4 w-4 " />
                                                        Block
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Hospitals Tab */}
                        {activeTab === 'hospitals' && (
                            <div className="space-y-4">
                                {hospitals.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No hospitals to review</h3>
                                        <p className="text-muted-foreground">All hospitals have been processed.</p>
                                    </div>
                                ) : (
                                    hospitals.map((hosp) => (
                                        <div
                                            key={hosp._id}
                                            className="bg-card rounded-xl p-6 shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 group"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    {/* Hospital Header */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                                                            <Building2 className="h-6 w-6 text-primary-foreground" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                {hosp.name}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Activity className="h-4 w-4" />
                                                                <span className="text-sm">Healthcare Facility</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Hospital Details */}
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                        <span>
                                                            <span className="font-medium">Location:</span> {hosp.location}
                                                        </span>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(hosp.status)}
                                                        <span className="text-sm font-medium">Status:</span>
                                                        <span className={`text-sm font-semibold capitalize ${getStatusColor(hosp.status)}`}>
                                                            {hosp.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-3 lg:flex-col lg:min-w-[140px]">
                                                    <button
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600   font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                                                        onClick={() => toggleHospitalStatus(hosp._id, 'active')}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Activate
                                                    </button>
                                                    <button
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600  font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                                                        onClick={() => toggleHospitalStatus(hosp._id, 'blocked')}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Block
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApprovalPanel;