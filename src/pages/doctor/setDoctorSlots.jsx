import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';
import AxiosInstances from '../../apiManager/index'

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

const SetDoctorSlots = () => {
  const [duration, setDuration] = useState(30);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().add(i, 'day');
    return {
      label: date.format('dddd, MMM D'),
      key: date.format('YYYY-MM-DD'),
    };
  });

  const fetchExistingAvailability = async () => {
    try {
      const res = await AxiosInstances.get('/doctor/availability');
      const initial = {};
      res.data.forEach((day) => {
        initial[day.date] = day.slots;
      });
      setAvailability(initial);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    }
  };

  useEffect(() => {
    fetchExistingAvailability();
  }, []);

  const handleSlotToggle = (dateKey, slot) => {
    const current = availability[dateKey] || [];
    const updated = current.includes(slot)
      ? current.filter((s) => s !== slot)
      : [...current, slot];

    setAvailability({ ...availability, [dateKey]: updated });
  };

  const handleSelectAll = (dateKey, allSlots) => {
    const current = availability[dateKey] || [];
    const allSelected = allSlots.every((s) => current.includes(s));
    setAvailability({
      ...availability,
      [dateKey]: allSelected ? [] : allSlots,
    });
  };

  const handleSave = async () => {
    const payload = Object.entries(availability).map(([date, slots]) => ({ date, slots }));
    try {
      setLoading(true);
      await AxiosInstances.post('/doctor/availability', payload)
      alert('Availability saved');
    } catch (err) {
      console.error('Error saving slots', err);
      alert('Error saving availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Set Your Weekly Availability</h2>

      <div className="mb-4">
        <label className="mr-4 font-medium">Slot Duration:</label>
        <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          <option value={15}>15 Minutes</option>
          <option value={30}>30 Minutes</option>
        </select>
      </div>

      {weekDays.map((day) => {
        const slots = generateTimeSlots('09:00', '21:00', duration);
        const selected = availability[day.key] || [];
        const allSelected = slots.every((s) => selected.includes(s));

        return (
          <div key={day.key} className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{day.label}</h3>
              <button
                onClick={() => handleSelectAll(day.key, slots)}
                className="text-blue-600 underline text-sm"
              >
                {allSelected ? 'Unselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => handleSlotToggle(day.key, slot)}
                  className={`px-3 py-1 rounded border text-sm ${
                    selected.includes(slot)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {dayjs(slot, 'HH:mm').format('hh:mm A')}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={handleSave}
        className="mt-4 px-6 py-2 bg-green-600 text-white rounded"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Availability'}
      </button>
    </div>
  );
};

export default SetDoctorSlots;
