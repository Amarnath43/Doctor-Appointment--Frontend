import React, { useEffect, useState, useRef } from 'react';
import { UserCheck, UserX, Loader2, Search, Users, Filter, ChevronDown, Calendar, Mail, Phone, Stethoscope } from 'lucide-react';
import AxiosInstances from '../../apiManager';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

// Helper function for CSS classes
const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ');
};

const AllUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef();
    const lastUserRef = useRef();

    const fetchUsers = async (reset = false) => {
        if (loading || (!reset && !hasMore)) return;
        setLoading(true);
        try {
            const query = [];
            if (searchTerm) query.push(`search=${searchTerm}`);
            if (roleFilter !== 'all') query.push(`role=${roleFilter}`);
            query.push(`page=${reset ? 1 : page}`);
            const res = await AxiosInstances.get(`/admin/all-users?${query.join('&')}`);
            const data = res.data;
            if (reset) {
                setUsers(data);
                setPage(2);
                setHasMore(data.length > 0);
            } else {
                setUsers((prev) => [...prev, ...data]);
                setPage((prev) => prev + 1);
                setHasMore(data.length > 0);
            }
        } catch (err) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchUsers(true);
        }, 400);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, roleFilter]);

    useEffect(() => {
        if (loading) return;
        const options = { threshold: 1.0 };
        const handleObserver = (entries) => {
            if (entries[0].isIntersecting && hasMore) {
                fetchUsers();
            }
        };
        const currentObserver = observer.current;
        if (currentObserver) currentObserver.disconnect();
        observer.current = new IntersectionObserver(handleObserver, options);
        if (lastUserRef.current) observer.current.observe(lastUserRef.current);
    }, [loading, hasMore]);

    const updateStatus = async (userId, newStatus) => {
        try {
            await AxiosInstances.patch(`/admin/updateuserstatus/${userId}`, { status: newStatus });
            toast.success('Status updated');
            fetchUsers(true);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const updateDoctorStatus = async (doctorId, newStatus) => {
        try {
            await AxiosInstances.patch(`/admin/updatedoctorstatus/${doctorId}`, { status: newStatus });
            toast.success('Status updated');
            fetchUsers(true);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const getAvailableStatusOptions = (currentStatus) => {
        return ['active', 'pending', 'blocked'].filter((s) => s !== currentStatus);
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
            pending: 'bg-amber-50 text-amber-700 ring-amber-200',
            blocked: 'bg-rose-50 text-rose-700 ring-rose-200'
        };
        return styles[status] || styles.pending;
    };

    const getRoleIcon = (role) => {
        return role === 'doctor' ?
            <Stethoscope className="h-4 w-4 text-blue-600" /> :
            <UserCheck className="h-4 w-4 text-green-600" />;
    };

    const getRoleBadgeStyle = (role) => {
        return role === 'doctor' ?
            'bg-blue-50 text-blue-700 ring-blue-200' :
            'bg-green-50 text-green-700 ring-green-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-1 sm:px-3 lg:px-5">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-md text-gray-600 mt-1">Manage and monitor all platform users.</p>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Search Input */}
                        <div className="relative w-full md:w-2/3">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Search by name, email or phone"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="relative w-full md:w-1/3">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Filter className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-10 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all">All Roles</option>
                                <option value="user">User</option>
                                <option value="doctor">Doctor</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    {/* User Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user, index) => (
                            <div
                                key={user._id || `user-${index}`}
                                ref={index === users.length - 1 ? lastUserRef : null}
                                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300"
                            >
                                {/* Card Header */}
                                <div className="flex items-start gap-4">
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={user.profilePicture || 'https://placehold.co/100x100'}
                                            alt={user.name}
                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow"
                                        />
                                        <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow">
                                            <span className={classNames('h-4 w-4 rounded-full flex items-center justify-center ring-1', getRoleBadgeStyle(user.role))}>
                                                {getRoleIcon(user.role)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 truncate">{user.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={classNames(`px-2 py-0.5 rounded-full text-xs font-semibold ring-1`, getRoleBadgeStyle(user.role))}>
                                                {user.role === 'doctor' ? 'Doctor' : 'User'}
                                            </span>
                                            <span className={classNames(`px-2 py-0.5 rounded-full text-xs font-semibold ring-1`, getStatusBadgeStyle(user.status))}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="mt-4 space-y-3">
                                    {/* Contact Information */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span>{user.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span>Joined {dayjs(user.createdAt).format('MMM D, YYYY')}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                                        {/* User Status Update */}
                                        <select
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer hover:bg-gray-100"
                                            defaultValue=""
                                            onChange={(e) => updateStatus(user._id, e.target.value)}
                                        >
                                            <option value="" disabled>Update User Status</option>
                                            {getAvailableStatusOptions(user.status).map((status) => (
                                                <option key={`${user._id}-user-${status}`} value={status}>
                                                    {`Change to ${status}`}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Doctor Status Update */}
                                        {user.role === 'doctor' && (
                                            <select
                                                className="w-full bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer hover:bg-blue-100"
                                                defaultValue=""
                                                onChange={(e) => {
                                                    if (user.doctorId) {
                                                        updateDoctorStatus(user.doctorId, e.target.value);
                                                    } else {
                                                        toast.error("Doctor ID not found for this user.");
                                                    }
                                                }}
                                            >
                                                <option value="" disabled>Update Doctor Status</option>
                                                {getAvailableStatusOptions(user.doctorStatus).map((status) => (
                                                    <option key={`${user.doctorId}-doctor-${status}`} value={status}>
                                                        {`Change to ${status}`}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                            <p className="mt-4 text-gray-600 text-lg font-medium">Loading users...</p>
                        </div>
                    )}

                    {/* End of Results */}
                    {!loading && !hasMore && users.length > 0 && (
                        <div className="text-center py-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-medium">You've reached the end of the list.</span>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && users.length === 0 && (
                        <div className="text-center py-16">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                            <p className="text-gray-600 text-sm max-w-sm mx-auto">
                                Try adjusting your search criteria or check back later for new users.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllUsers;