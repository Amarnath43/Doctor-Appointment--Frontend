import React, { useState, useEffect } from 'react';
import AxiosInstances from '../../apiManager';
import { format, subDays, subMonths, subYears } from 'date-fns';
import {
  Calendar,
  Search,
  Filter as FilterIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PRESETS = [
  { label: '1 Day', value: '1D' },
  { label: '7 Days', value: '7D' },
  { label: '1 Month', value: '1M' },
  { label: '3 Months', value: '3M' },
  { label: '6 Months', value: '6M' },
  { label: '1 Year', value: '1Y' },
];

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState('7D');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(subDays(new Date(), -7), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const applyPreset = (value) => {
    setPreset(value);
    const now = new Date();
    let start;
    switch (value) {
      case '1D': start = subDays(now, 1); break;
      case '7D': start = subDays(now, 7); break;
      case '1M': start = subMonths(now, 1); break;
      case '3M': start = subMonths(now, 3); break;
      case '6M': start = subMonths(now, 6); break;
      case '1Y': start = subYears(now, 1); break;
      default: start = subDays(now, 7);
    }
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(now, 'yyyy-MM-dd'));
    setCurrentPage(1);
  };

  const fetchAppointments = async () => {
  setLoading(true);
  try {
    const res = await AxiosInstances.get('/doctor/appointments', {
      params: {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        startDate,
        endDate,
        status: statusFilter.join(',')
      }
    });

    console.log('✅ Appointments Response:', res.data);

    setAppointments(res.data.data); // how many items here?
    setTotalPages(res.data.pagination?.totalPages || 1);
  } catch (err) {
    toast.error('Failed to load appointments');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAppointments();
  }, [currentPage, startDate, endDate, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchAppointments();
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const goTo = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportExcel = () => {
    const wsData = appointments.map((a, idx) => ({
      'S.No': idx + 1,
      'Date': format(new Date(a.date), 'yyyy-MM-dd'),
      'Time': a.time,
      'Patient Name': a.patient,
      'Status': a.status,
      'Mode of Payment': a.modeOfPayment,
    }));

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
    XLSX.writeFile(workbook, `appointments_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const renderPager = () => {
    const btns = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    btns.push(<button key="prev" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded"> <ChevronLeft className="h-4 w-4" /></button>);

    if (startPage > 1) {
      btns.push(<button key={1} onClick={() => goTo(1)} className="px-3 py-1 border rounded">1</button>);
      if (startPage > 2) btns.push(<span key="e1" className="px-2">…</span>);
    }

    for (let p = startPage; p <= endPage; p++) {
      btns.push(<button key={p} onClick={() => goTo(p)} className={`px-3 py-1 border rounded ${p === currentPage ? 'bg-blue-600 text-white' : ''}`}>{p}</button>);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) btns.push(<span key="e2" className="px-2">…</span>);
      btns.push(<button key={totalPages} onClick={() => goTo(totalPages)} className="px-3 py-1 border rounded">{totalPages}</button>);
    }

    btns.push(<button key="next" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded"> <ChevronRight className="h-4 w-4" /></button>);
    return btns;
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Appointment History</h1>
          <p className="text-gray-500">Track and manage your appointment records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowFilters(f => !f)} className="px-4 py-2 border rounded flex items-center gap-2">
            <FilterIcon className="h-4 w-4" /> Filters
          </button>
          <button onClick={exportExcel} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow">
            Export Excel
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search by patient name…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border rounded pl-10 pr-4 py-2"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded p-4 space-y-4">
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => applyPreset(p.value)}
                className={`px-3 py-1 rounded ${preset === p.value ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >{p.label}</button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm">From</label>
              <input type="date" value={startDate} onChange={e => { setPreset(''); setStartDate(e.target.value); }} className="border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm">To</label>
              <input type="date" value={endDate} onChange={e => { setPreset(''); setEndDate(e.target.value); }} className="border rounded px-2 py-1" />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-4">
            {['Completed', 'Confirmed', 'Cancelled'].map(s => (
              <label key={s} className="inline-flex items-center gap-1">
                <input type="checkbox" value={s} checked={statusFilter.includes(s)} onChange={e => {
                  const checked = e.target.checked;
                  setStatusFilter(prev => checked ? [...prev, s] : prev.filter(x => x !== s));
                }} />
                <span>{s}</span>
              </label>
            ))}
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter([]);
              setPreset('7D');
              applyPreset('7D');
            }}
            className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-100"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white shadow rounded">
        <div className="border-b px-4 py-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Appointments</h2>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : appointments.length > 0 ? (
            appointments.map((a, idx) => (
              <div key={a._id || a.id} className="mb-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">{(currentPage - 1) * 10 + idx + 1}. {a.patientName}</h3>
                  <span className="text-sm text-gray-600">{a.modeOfPayment}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2 items-center">
                  <span className="flex items-center gap-1">📅 {format(new Date(a.date), 'dd MMM yyyy')}</span>
                  <span className="flex items-center gap-1">🕒 {a.time}</span>

                  {/* Current Status Label */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${a.status === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : a.status === 'Confirmed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {a.status}
                  </span>

                  {/* Status Update Dropdown */}
                  {a.status !== 'Completed' && a.status !== 'Cancelled' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <label className="text-sm font-medium text-gray-700">Update Status:</label>
                      <select
                        value={a.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            await AxiosInstances.put(`/doctor/appointments/${a.id}/status`, { status: newStatus });
                            toast.success('Status updated');
                            fetchAppointments();
                          } catch (err) {
                            toast.error('Failed to update status');
                          }
                        }}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No appointments found for these filters.
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {renderPager()}
        </div>
      )}
    </div>
  );
}
