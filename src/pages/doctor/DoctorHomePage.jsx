import React, { useEffect, useState } from 'react';
import AppointmentCard from '../../components/doctorDashboardComponents/AppointmentCard';
import { motion } from 'framer-motion';
import { CalendarCheck, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import NavBar from '../../components/NavBar';
import AxiosInstances from '../../apiManager';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const iconMap = {
    "Today's Appointments": <CalendarCheck className="w-5 h-5 text-blue-500" />,
    "Today's Revenue": <CreditCard className="w-5 h-5 text-green-500" />,
    Completed: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    Upcoming: <Clock className="w-5 h-5 text-yellow-500" />,
    Cancelled: <XCircle className="w-5 h-5 text-red-500" />
};

const DoctorHomePage = () => {
    const [filter, setFilter] = useState('All');
    const [summary, setSummary] = useState(null);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [nextAppointment, setNextAppointment] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [appointmentsLoading, setAppointmentsLoading] = useState(true);

    const handleStatusChange = async (id, status) => {
        await AxiosInstances.put(`/doctor/appointments/${id}/status`, { status });
        toast.success(`Marked as ${status}`);
        fetchDashboardSummary();
    };


    const fetchDashboardSummary = async () => {
        setSummaryLoading(true);
        try {
            const { data } = await AxiosInstances.get('/doctor/dashboard-summary');
            if (data.success) {
                setSummary(data.data.summary);
                setNextAppointment(data.data.nextAppointment);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard summary:', error);
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardSummary();
    }, []);


    useEffect(() => {
        const fetchFilteredAppointments = async () => {
            setAppointmentsLoading(true);
            try {
                const { data } = await AxiosInstances.get(`/doctor/today-appointments?status=${filter}&page=${currentPage}&limit=10`);
                if (data.success) {
                    setFilteredAppointments(data.data);
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (err) {
                console.error('Failed to fetch today appointments:', err);
            } finally {
                setAppointmentsLoading(false);
            }
        };
        fetchFilteredAppointments();
    }, [filter, currentPage]);

    const summaryData = [
        { title: "Today's Appointments", value: summary?.totalAppointments },
        { title: "Today's Revenue", value: summary?.revenue },
        { title: "Completed", value: summary?.completed },
        { title: "Upcoming", value: summary?.confirmed },
        { title: "Cancelled", value: summary?.cancelled },
    ];

    const appointmentStats = [
        { name: 'Confirmed', value: summary?.confirmed || 0 },
        { name: 'Completed', value: summary?.completed || 0 },
        { name: 'Cancelled', value: summary?.cancelled || 0 }
    ];

    const COLORS = ['#FACC15', '#10B981', '#EF4444'];

    return (
        <div className='px-4 sm:px-20 pt-3'>
            <NavBar />

            {/* Summary and Pie Chart */}
            <div className="space-y-6 my-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border p-5 rounded">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {summaryLoading ? (
                            Array(5).fill(0).map((_, idx) => (
                                <div key={idx} className="rounded-2xl shadow-md p-4 bg-gray-100 animate-pulse h-[100px]" />
                            ))
                        ) : (
                            summaryData.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    className="rounded-2xl shadow-md p-4 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition min-h-[100px] flex flex-col justify-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div className="flex items-center gap-3">
                                        {iconMap[item.title]}
                                        <div>
                                            <div className="text-gray-500 text-sm">{item.title}</div>
                                            <div className="text-xl sm:text-2xl font-semibold text-gray-800 mt-1">{item.value}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <h2 className="text-lg font-semibold mb-2 text-center">Appointment Status Overview</h2>
                        <div className="w-full h-64">
                            {summaryLoading ? (
                                <div className="h-full flex items-center justify-center text-gray-400 animate-pulse">Loading chart...</div>
                            ) : appointmentStats.some((s) => s.value > 0) ? (
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={appointmentStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {appointmentStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex justify-center items-center text-gray-500">No appointment data to display</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Next Appointment */}
            <div className='mb-4'>
                <h2 className="text-lg font-semibold mb-2">Next Appointment</h2>
                {summaryLoading ? (
                    <div className="rounded-lg bg-gray-100 h-24 animate-pulse" />
                ) : nextAppointment ? (
                    <AppointmentCard
                        appointment={nextAppointment}
                        index={1}
                        role="doctor"
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <p className="text-gray-500">No upcoming appointments for today.</p>
                )}
            </div>

            {/* Today's Appointments */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Today's Appointments</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {['All', 'Confirmed', 'Completed', 'Cancelled'].map((f) => (
                        <button
                            key={f}
                            className={`px-4 py-1 rounded-full border transition text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="space-y-3">
                    {appointmentsLoading ? (
                        Array(3).fill(0).map((_, idx) => (
                            <div key={idx} className="rounded-lg bg-gray-100 h-24 animate-pulse" />
                        ))
                    ) : filteredAppointments.length === 0 ? (
                        <p className="text-gray-500">No appointments.</p>
                    ) : (
                        filteredAppointments.map((appt, index) => (
                            <AppointmentCard
                                key={appt.id}
                                appointment={appt}
                                index={index + 1}
                                role="doctor"
                                onStatusChange={handleStatusChange}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex gap-2 mt-4">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default DoctorHomePage;
