import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import AxiosInstances from '../../apiManager';
import { Loader2, CheckCircle, User, Ban, AlertTriangle } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useBlocker } from 'react-router-dom';
import toast from 'react-hot-toast';

dayjs.extend(customParseFormat);

/* ---------- Helpers ---------- */
const generateTimeSlots = (start = '09:00', end = '21:00', duration = 30) => {
  const slots = [];
  let current = dayjs(start, 'HH:mm');
  const endTime = dayjs(end, 'HH:mm');
  while (current.isBefore(endTime)) {
    slots.push(current.format('HH:mm'));
    current = current.add(duration, 'minute');
  }
  return slots;
};

const groupSlotsByTimeOfDay = (slots) => {
  const groups = { Morning: [], Afternoon: [], Evening: [] };
  slots.forEach((slot) => {
    const hour = Number(slot.slice(0, 2));
    if (hour < 12) groups.Morning.push(slot);
    else if (hour < 17) groups.Afternoon.push(slot);
    else groups.Evening.push(slot);
  });
  return Object.entries(groups).filter(([, arr]) => arr.length > 0);
};

const SetDoctorSlots = () => {
  const [duration, setDuration] = useState(30);
  const [availability, setAvailability] = useState({});
  const [initialAvailability, setInitialAvailability] = useState({});
  const [bookedSlots, setBookedSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedDay, setSelectedDay] = useState(dayjs().format('YYYY-MM-DD'));
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = dayjs().add(i, 'day');
        return {
          labelTop: d.format('ddd'),
          labelBottom: d.format('MMM D'),
          key: d.format('YYYY-MM-DD'),
        };
      }),
    []
  );

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(availability) !== JSON.stringify(initialAvailability),
    [availability, initialAvailability]
  );

  const blocker = useBlocker(hasUnsavedChanges);
  useEffect(() => {
    setLeaveModalOpen(blocker.state === 'blocked');
  }, [blocker.state]);

  /* ---------- Fetch ---------- */
  const fetchAvailability = async () => {
    try {
      setFetching(true);
      const res = await AxiosInstances.get('/doctor/availability');
      const initial = {};
      (res.data?.available || []).forEach((d) => {
        initial[d.date] = d.slots || [];
      });
      setAvailability(initial);
      setInitialAvailability(initial);
      setBookedSlots(res.data?.booked || {});
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  /* ---------- Before unload if unsaved ---------- */
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  /* ---------- Status ---------- */
  const getSlotStatus = (dateKey, slot) => {
    const now = dayjs();
    const slotTime = dayjs(`${dateKey}T${slot}`);
    const isExpired = slotTime.isBefore(now);
    const isBooked = bookedSlots?.[dateKey]?.includes?.(slot);
    const wasAvailable = initialAvailability?.[dateKey]?.includes?.(slot);
    const isSelected = availability?.[dateKey]?.includes?.(slot);

    if (isBooked) return 'booked';
    if (isExpired) return 'expired';
    if (isSelected) return wasAvailable ? 'available' : 'selected';
    return 'vacant';
  };

  /* ---------- Toggle / Select All ---------- */
  const handleSlotToggle = (dateKey, slot) => {
    const status = getSlotStatus(dateKey, slot);
    if (status === 'booked' || status === 'expired') return;

    const current = new Set(availability[dateKey] || []);
    current.has(slot) ? current.delete(slot) : current.add(slot);
    setAvailability({ ...availability, [dateKey]: Array.from(current).sort() });
  };

  const handleSelectAll = (dateKey, allSlots) => {
    const nonDisabled = allSlots.filter((slot) => {
      const st = getSlotStatus(dateKey, slot);
      return st !== 'booked' && st !== 'expired';
    });
    const current = new Set(availability[dateKey] || []);
    const isAllSelected = nonDisabled.length > 0 && nonDisabled.every((s) => current.has(s));

    if (isAllSelected) nonDisabled.forEach((s) => current.delete(s));
    else nonDisabled.forEach((s) => current.add(s));

    setAvailability({ ...availability, [dateKey]: Array.from(current).sort() });
  };

  /* ---------- Save ---------- */
  const handleSave = () => setConfirmModalOpen(true);

  const executeSave = async () => {
    setConfirmModalOpen(false);
    const payload = Object.entries(availability).map(([date, slots]) => ({ date, slots }));
    try {
      setLoading(true);
      await AxiosInstances.post('/doctor/availability', payload);
      await fetchAvailability();
      toast.success('Availability saved successfully!');
    } catch (err) {
      console.error('Error saving slots', err);
      toast.error('Error saving availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Styles ---------- */
  const styleMap = {
    booked: 'bg-red-500 text-white cursor-not-allowed',
    expired: 'bg-gray-400 text-gray-700 cursor-not-allowed',
    available: 'bg-blue-600 text-white',
    selected: 'bg-green-500 text-white',
    vacant: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };

  const allSlots = generateTimeSlots('09:00', '21:00', duration);
  const groups = groupSlotsByTimeOfDay(allSlots);

  return (
    <>
      <div className="bg-slate-50 flex flex-col h-full">
        <div className="p-4 sm:p-6 flex-1 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Header */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-200/80 flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Set Your Weekly Availability</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Select time slots to make them available for booking.
              </p>
            </div>
            <button
              onClick={handleSave}
              className="ml-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 text-white text-sm sm:text-base font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-all disabled:bg-indigo-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
              disabled={loading || fetching || !hasUnsavedChanges}
            >
              {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-600 px-1 sm:px-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500 flex items-center justify-center">
                <User size={10} className="text-white" />
              </div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400 flex items-center justify-center">
                <Ban size={10} className="text-white" />
              </div>
              <span>Expired</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-gray-100" />
              <span>Vacant</span>
            </div>
          </div>

          {/* Day tabs + duration — mobile-friendly, horizontal scroll */}
          <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-gray-200/80">
            <div className="flex items-center justify-between gap-3">
              <div
                className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
                aria-label="Pick a day"
              >
                {weekDays.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDay(d.key)}
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all min-w-[84px] sm:min-w-[96px] text-center snap-start ${
                      selectedDay === d.key
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                    title={`${d.labelTop} ${d.labelBottom}`}
                  >
                    <span className="block">{d.labelTop}</span>
                    <span className="text-[10px] sm:text-xs font-normal">{d.labelBottom}</span>
                  </button>
                ))}
              </div>

              <div className="shrink-0">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mr-2">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="rounded-md border-gray-300 text-xs sm:text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
          </div>

          {/* Slots Card — ONLY this area scrolls */}
          {fetching ? (
            <div className="flex-1 grid place-items-center bg-white rounded-2xl shadow-sm border border-gray-200/80">
              <div className="text-center py-8 text-gray-500 text-sm">Loading schedule…</div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/80 flex flex-col overflow-hidden">
              {/* Small header inside card */}
              <div className="sticky top-0 z-10 bg-white px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-bold text-gray-700">
                    {dayjs(selectedDay).format('dddd, MMM D')}
                  </h3>
                  <button
                    onClick={() => handleSelectAll(selectedDay, allSlots)}
                    className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Select All
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 pr-6">
                {groups.map(([groupName, slots]) => (
                  <div key={groupName} className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-600">{groupName}</h4>

                    {/* Responsive grid for slots */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                      {slots.map((slot) => {
                        const status = getSlotStatus(selectedDay, slot);
                        const isDisabled = status === 'booked' || status === 'expired';
                        return (
                          <button
                            key={slot}
                            onClick={() => handleSlotToggle(selectedDay, slot)}
                            disabled={isDisabled}
                            className={`px-2 sm:px-3 py-2 rounded-md text-[11px] sm:text-sm font-semibold transition-all ${styleMap[status]}`}
                          >
                            {dayjs(slot, 'HH:mm').format('hh:mm A')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Changes"
        message="Are you sure you want to save these changes to your availability?"
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={executeSave}
        variant="primary"
        confirmText="Yes, Save Changes"
        cancelText="Cancel"
        icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
      />

      {/* Navigation blocker modal */}
      <ConfirmationModal
        isOpen={isLeaveModalOpen}
        title="Leave this page?"
        message="You have unsaved changes. Do you want to leave without saving?"
        onCancel={() => {
          blocker.reset();
          setLeaveModalOpen(false);
        }}
        onConfirm={() => {
          blocker.proceed();
          setLeaveModalOpen(false);
        }}
        variant="warning"
        confirmText="Leave without saving"
        cancelText="Stay"
        icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
      />
    </>
  );
};

export default SetDoctorSlots;