import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import AxiosInstances from '../../apiManager';
import { Loader2, CheckCircle, User, Ban, AlertTriangle } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import {useBlocker } from 'react-router-dom';

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
  const [initialAvailability, setInitialAvailability] = useState({}); // Store original state
  const [bookedSlots, setBookedSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedDay, setSelectedDay] = useState(dayjs().format('YYYY-MM-DD'));
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false); // State for modal
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);  // navigation modal

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = dayjs().add(i, 'day');
        return {
          labelTop: d.format('ddd'),
          labelBottom: d.format('MMM D'),
          key: d.format('YYYY-MM-DD')
        };
      }),
    []
  );

  // Check for unsaved changes by comparing current and initial state
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(availability) !== JSON.stringify(initialAvailability);
  }, [availability, initialAvailability]);

   const blocker = useBlocker(hasUnsavedChanges);

 useEffect(() => {
   // When the router tries to navigate and we're blocking, show the modal
   if (blocker.state === 'blocked') {
     setLeaveModalOpen(true);
   } else {
     setLeaveModalOpen(false);
   }
 }, [blocker.state]);

  useEffect(() => {
  setLeaveModalOpen(blocker.state === 'blocked');
}, [blocker, blocker.state]);

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
      setInitialAvailability(initial); // Set both states on fetch
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

  /* ---------- Prevent navigation with unsaved changes ---------- */
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = ''; // Required for Chrome/Firefox
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    // Cleanup listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  /* ---------- Status Logic ---------- */
  const getSlotStatus = (dateKey, slot) => {
    const now = dayjs();
    const slotTime = dayjs(`${dateKey}T${slot}`);
    const isExpired = slotTime.isBefore(now);
    const isBooked = bookedSlots?.[dateKey]?.includes?.(slot);
    const isAvailableInitially = initialAvailability?.[dateKey]?.includes?.(slot);
    const isSelectedLocally = availability?.[dateKey]?.includes?.(slot);

    if (isBooked) return 'booked';
    if (isExpired) return 'expired';

    if (isSelectedLocally) {
      return isAvailableInitially ? 'available' : 'selected';
    }

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

    if (isAllSelected) {
      nonDisabled.forEach((s) => current.delete(s));
    } else {
      nonDisabled.forEach((s) => current.add(s));
    }
    setAvailability({ ...availability, [dateKey]: Array.from(current).sort() });
  };

  /* ---------- Save Logic with Confirmation ---------- */
  const handleSave = () => {
    setConfirmModalOpen(true);
  };

  const executeSave = async () => {
    setConfirmModalOpen(false);
    const payload = Object.entries(availability).map(([date, slots]) => ({ date, slots }));
    try {
      setLoading(true);
      await AxiosInstances.post('/doctor/availability', payload);
      alert('Availability saved successfully!');
      await fetchAvailability();
    } catch (err) {
      console.error('Error saving slots', err);
      alert('Error saving availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI helpers ---------- */
  const styleMap = {
    booked: 'bg-red-500 text-white cursor-not-allowed',
    expired: 'bg-gray-400 text-gray-700 cursor-not-allowed',
    available: 'bg-blue-600 text-white', // Previously saved
    selected: 'bg-green-500 text-white', // Newly selected
    vacant: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  };

  return (
    <>
      <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200/80 mb-6 sticky top-4 z-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Set Your Weekly Availability</h1>
              <p className="text-sm text-gray-500 mt-1">Select time slots to make them available for booking.</p>
            </div>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-all disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || fetching || !hasUnsavedChanges}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm text-gray-600 px-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                <User size={10} className="text-white" />
              </div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded flex items-center justify-center">
                <Ban size={10} className="text-white" />
              </div>
              <span>Expired</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border rounded" />
              <span>Vacant</span>
            </div>
          </div>

          {/* Day Tabs + Duration */}
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200/80 mb-6 flex items-center justify-between">
            <div className="flex space-x-2">
              {weekDays.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setSelectedDay(d.key)}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all w-24 text-center ${
                    selectedDay === d.key
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <span className="block">{d.labelTop}</span>
                  <span className="text-xs font-normal">{d.labelBottom}</span>
                </button>
              ))}
            </div>
            <div className="pr-4">
              <label className="text-sm font-medium text-gray-700 mr-2">Slot Duration:</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>

          {/* Body */}
          {fetching ? (
            <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-gray-200/80">
              <Loader2 className="mx-auto w-8 h-8 text-indigo-500 animate-spin" />
              <p className="mt-2 text-gray-500">Loading your schedule...</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
              {(() => {
                const allSlots = generateTimeSlots('09:00', '21:00', duration);
                const groups = groupSlotsByTimeOfDay(allSlots);

                const nonDisabledForDay = allSlots.filter((slot) => {
                  const st = getSlotStatus(selectedDay, slot);
                  return st !== 'booked' && st !== 'expired';
                });
                const currentSet = new Set(availability[selectedDay] || []);
                const isAllSelectedDay =
                  nonDisabledForDay.length > 0 && nonDisabledForDay.every((s) => currentSet.has(s));

                return (
                  <>
                    <div className="flex justify-between items-center mb-4 pb-3 border-b">
                      <h3 className="text-base font-bold text-gray-700">
                        {dayjs(selectedDay).format('dddd, MMM D')}
                      </h3>
                      <button
                        onClick={() => handleSelectAll(selectedDay, allSlots)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {isAllSelectedDay ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {groups.map(([groupName, slots]) => (
                      <div key={groupName} className="mb-6 last:mb-0">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3">{groupName}</h4>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => {
                            const status = getSlotStatus(selectedDay, slot);
                            const isDisabled = status === 'booked' || status === 'expired';
                            
                            return (
                              <button
                                key={slot}
                                onClick={() => handleSlotToggle(selectedDay, slot)}
                                disabled={isDisabled}
                                className={`px-3 py-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center min-w-[110px] ${styleMap[status]}`}
                              >
                                {dayjs(slot, 'HH:mm').format('hh:mm A')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
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

       <ConfirmationModal
   isOpen={isLeaveModalOpen}
   title="Leave this page?"
  message="You have unsaved changes. Do you want to leave without saving?"   onCancel={() => {
    blocker.reset();          // stay on the page
    setLeaveModalOpen(false);
  }}
   onConfirm={() => {    blocker.proceed();        // continue navigation+     setLeaveModalOpen(false);
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
