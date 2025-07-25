import React, { useEffect, useState, useRef } from 'react';
import { UserCheck, UserX, Loader2, Search } from 'lucide-react';
import AxiosInstances from '../../apiManager';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const AllUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef();

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
            console.log(data)
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

    const lastUserRef = useRef();
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

    const updateDoctorStatus = async (userId, newStatus) => {
        try {
            console.log(userId)
            await AxiosInstances.patch(`/admin/updatedoctorstatus/${userId}`, { status: newStatus });
            toast.success('Status updated');
            fetchUsers(true);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const getAvailableStatusOptions = (currentStatus) => {
        return ['active', 'pending', 'blocked'].filter((s) => s !== currentStatus);
    };

    return (
        <div className=" max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search by name, email or phone"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="doctor">Doctor</option>
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user, index) => (
                    <div
                        key={user._id || `user-${index}`}
                        ref={index === users.length - 1 ? lastUserRef : null}
                        className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative">
                                <img
                                    src={user.profilePicture || '/default-avatar.png'}
                                    alt={user.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition">{user.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className="capitalize">{user.role}</span>
                                    {user.role === 'user' ? <UserCheck className="h-4 w-4 text-blue-500" /> : <UserX className="h-4 w-4 text-rose-500" />}
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="mt-3 text-sm text-gray-700 space-y-1">
                            <p><span className="font-medium">📧 Email:</span> {user.email}</p>
                            <p><span className="font-medium">📱 Phone:</span> {user.phone}</p>
                            <p><span className="font-medium">🕒 Created:</span> {dayjs(user.createdAt).format('MMM D, YYYY')}</p>
                            <p>
                                <span className="font-medium">✅ Status:</span>{' '}
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold 
        ${user.status === 'active' ? 'bg-green-100 text-green-700' :
                                        user.status === 'blocked' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'}`}>
                                    {user.status}
                                </span>
                            </p>
                            {user.role === 'doctor' && (
                                <p>
                                    <span className="font-medium">🩺 Doctor Status:</span>{' '}
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold 
      ${user.doctorStatus === 'active' ? 'bg-green-100 text-green-700' :
                                            user.doctorStatus === 'blocked' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'}`}>
                                        {user.doctorStatus}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Status dropdown */}
                        <div className="mt-4">
                            <select
                                className="w-[50%] border rounded-lg px-3 py-2 text-sm bg-gray-100 focus:outline-none hover:bg-gray-50"
                                defaultValue=""
                                onChange={(e) => updateStatus(user._id, e.target.value)}
                            >
                                <option value="" disabled>Update User Status</option>
                                {getAvailableStatusOptions(user.status).map((status) => (
                                    <option key={`${user._id}-user-${status}`} value={status}>{status}</option>

                                ))}
                            </select>
                        </div>


                        {
                            user.role == 'doctor' && (
                                <div className="mt-4">
                                    <select
                                        className="w-[50%] border rounded-lg px-3 py-2 text-sm bg-gray-100 focus:outline-none hover:bg-gray-50"
                                        defaultValue=""
                                        onChange={(e) => {
                                            if (user.doctorId) {
                                                updateDoctorStatus(user.doctorId, e.target.value);
                                            } else {
                                                toast.error("Doctor ID not found for this user.");
                                            }
                                        }

                                        }

                                    >
                                        <option value="" disabled>Update Doctor Status</option>
                                        {getAvailableStatusOptions(user.doctorStatus).map((status) => (
                                            <option key={`${user.doctorId}-doctor-${status}`} value={status}>{status}</option>

                                        ))}
                                    </select>
                                </div>
                            )
                        }


                    </div>

                ))}
            </div>

            {loading && (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
            )}

            {!loading && !hasMore && users.length > 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                    — End of results —
                </div>
            )}
        </div>
    );
};

export default AllUsers;
