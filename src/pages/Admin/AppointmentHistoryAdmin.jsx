// pages/admin/AppointmentHistoryAdmin.jsx
import React, { useEffect, useState } from 'react';
import AppointmentCard from '../../components/doctorDashboardComponents/AppointmentCard'
import AxiosInstances from '../../apiManager/index'
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { Search, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const AppointmentHistoryAdmin = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(subDays(new Date(), -7), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    try {
      const res = await AxiosInstances.get('/admin/appointment-history', {
        params: {
          page,
          startDate,
          endDate,
          status: statusFilter.join(','),
          search: searchTerm
        }
      });

      setAppointments(res.data.data);
      console.log(res.data.data)
      setTotalPages(res.data.pagination.totalPages);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [page, startDate, endDate, statusFilter]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchAppointments();
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const exportExcel = () => {
    const rows = appointments.map((a, i) => ({
      'S.No': i + 1,
      'Date': a.date,
      'Time': a.time,
      'Patient': a.patientName,
      'Doctor': a.doctorName,
      'Status': a.status,
      'Payment Mode': a.modeOfPayment
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
    XLSX.writeFile(workbook, `admin_appointments_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="sticky top-6 z-30 bg-gray-50 pt-4 pb-3 shadow-sm space-y-4">
  {/* Header and Export */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 px-2">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold">Admin Appointment History</h1>
      <p className="text-gray-500 text-sm sm:text-base">
        Monitor all appointments across doctors and patients
      </p>
    </div>
    <button
      onClick={exportExcel}
      className="mt-2 sm:mt-0 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded shadow flex items-center gap-1"
    >
      <Download className="h-4 w-4" />
      Export
    </button>
  </div>

  {/* Search & Date */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-2">
    <div className="col-span-1 md:col-span-2">
      <input
        type="text"
        placeholder="Search doctor or patient..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 text-sm border rounded"
      />
    </div>
    <div>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="w-full px-2 py-2 text-sm border rounded"
      />
    </div>
    <div>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="w-full px-2 py-2 text-sm border rounded"
      />
    </div>
  </div>

  {/* Status Filters */}
  <div className="flex flex-wrap gap-3 px-2 text-sm">
    {['Completed', 'Confirmed', 'Cancelled'].map((s) => (
      <label key={s} className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={statusFilter.includes(s)}
          onChange={(e) =>
            setStatusFilter((prev) =>
              e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)
            )
          }
        />
        <span>{s}</span>
      </label>
    ))}
    <button
      onClick={() => {
        setStatusFilter([]);
        setSearchTerm('');
        setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
        setEndDate(format(new Date(), 'yyyy-MM-dd'));
      }}
      className="text-blue-600 underline"
    >
      Clear Filters
    </button>
  </div>
</div>



      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <div className="text-center text-gray-600 py-6">
            No appointments found.
          </div>
        ) : (
          appointments.map((appt, i) => {
            // compute the serial number so it continues across pages
            const serial = (page - 1) * 10 + i + 1;
            return (
              <div
                key={appt.id}
                onClick={() => navigate(`/appointment/${appt.id}`)}
                className="cursor-pointer"
              >
                <AppointmentCard
                  appointment={appt}
                  index={serial}
                  role="admin"
                />
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
              className={`px-3 py-1 border rounded ${idx + 1 === page ? 'bg-blue-600 text-white' : ''
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
