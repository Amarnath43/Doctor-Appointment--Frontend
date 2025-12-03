import React, { useEffect, useState, useRef } from 'react';
import AppointmentCard from '../../components/doctorDashboardComponents/AppointmentCard';
import AxiosInstances from '../../apiManager/index';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 10; // keep in sync with backend

const AppointmentHistoryAdmin = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd')); // ✅ fixed
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const listRef = useRef(null);
  const lastScrolledPageRef = useRef(page);

  // reset to page 1 when any filter (except page) changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, startDate, endDate, statusFilter]);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    // debounce typing for 400ms
    const t = setTimeout(async () => {
      try {
        const res = await AxiosInstances.get('/admin/appointment-history', {
          params: {
            page,
            startDate,
            endDate,
            status: statusFilter.join(','),
            search: searchTerm,
            pageSize: PAGE_SIZE,
          },
          signal: controller.signal, // axios >=1 supports AbortController
        });

        if (aborted) return;
        setAppointments(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages ?? 1);

        // Only scroll when page changes (not on every filter change fetch)
        if (lastScrolledPageRef.current !== page) {
          lastScrolledPageRef.current = page;
          // Scroll list into view (sticky header safe)
          listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Or: window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch appointments', err);
      }
    }, 400);

    return () => {
      aborted = true;
      controller.abort();
      clearTimeout(t);
    };
  }, [page, startDate, endDate, statusFilter, searchTerm]);

  const exportExcel = () => {
    const rows = appointments.map((a, i) => ({
      'S.No': (page - 1) * PAGE_SIZE + i + 1, // ✅ serial continuous across pages
      'Date': a.date,
      'Time': a.time,
      'Patient': a.patientName,
      'Doctor': a.doctorName,
      'Status': a.status,
      'Payment Mode': a.modeOfPayment,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
    XLSX.writeFile(wb, `admin_appointments_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const toggleStatus = (s) =>
  {
    console.log('Toggling status filter:', s);
     setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  }
   

  const clearFilters = () => {
    setStatusFilter([]);
    setSearchTerm('');
    setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd')); // ✅ today
  };

  // inside AppointmentHistoryAdmin component

const handleStatusChange = async (id, newStatus) => {
  try {
    // optimistic UI update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));

    // call API (adjust endpoint & payload)
    await AxiosInstances.put(`/doctor/appointments/${id}/status`, { status: newStatus });
    
toast.success(`Appointment status updated to ${newStatus}`);
    // optionally re-fetch or show toast
  } catch (err) {
    console.error('Failed to update status', err);
    // revert on failure
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: appointments.find(x => x.id === id)?.status ?? a.status } : a));
  }
};


  return (
    <div className="max-w-7xl mx-auto p-2 space-y-6">
      <div className="sticky top-0 z-30 bg-white pt-6 pb-4 shadow-md space-y-6 border-b border-gray-200">
        {/* Header and Export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Appointment History</h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Monitor all appointments across doctors and patients
            </p>
          </div>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow"
          >
            <Download className="h-5 w-5" />
            Export
          </button>
        </div>

        {/* Search & Date */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 px-4">
          <div className="w-full lg:flex-1">
            <input
              type="text"
              placeholder="Search doctor or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-4 px-4 text-sm">
          {['Completed', 'Confirmed', 'Cancelled'].map((s) => (
            <label key={s} className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={statusFilter.includes(s)}
                onChange={() => toggleStatus(s)}
                className="accent-blue-600"
              />
              {s}
            </label>
          ))}
          <button onClick={clearFilters} className="ml-auto text-sm text-blue-600 hover:underline">
            Clear Filters
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4" ref={listRef}>
        {appointments.length === 0 ? (
          <div className="text-center text-gray-600 py-6">No appointments found.</div>
        ) : (
          appointments.map((appt, i) => {
            const serial = (page - 1) * PAGE_SIZE + i + 1;
            return (
              <div
                key={appt.id}
                onClick={() => navigate(`/appointment/${appt.id}`)}
                className="cursor-pointer"
              >
                <AppointmentCard appointment={appt} index={serial} role="admin" onStatusChange={handleStatusChange} />
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx + 1)}
              className={`px-3 py-1 border rounded ${
                idx + 1 === page ? 'bg-blue-600 text-white' : ''
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentHistoryAdmin;
