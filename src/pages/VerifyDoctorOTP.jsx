import React, { useState } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';   
import toast from 'react-hot-toast'

const VerifyDoctorOtp = ({ email, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate=useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);

    try {
        const email=localStorage.getItem('authEmail')
      const response = await axios.post('/api/doctor/verify-otp', {
        email,
        otp
      });
      toast.success(response.data.message)
      navigate('/signin')
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Verify Your Email</h2>
      <p className="text-sm text-gray-600 mb-3">
        An OTP has been sent to <strong>{email}</strong>. Please enter it below.
      </p>

      <form onSubmit={handleVerify}>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength="6"
          placeholder="Enter OTP"
          className="w-full p-2 border border-gray-300 rounded mb-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Verifying...' : 'Verify & Register'}
        </button>
      </form>

    </div>
  );
};

export default VerifyDoctorOtp;
