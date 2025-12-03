import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AxiosInstances from '../apiManager';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const storedEmail = localStorage.getItem('resetEmail');
    if (!storedEmail) {
      toast.error('No email found. Please start from Forgot Password page.');
      navigate('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  // ⏳ Countdown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (!email) return;

    try {
      await AxiosInstances.post('/user/forgot-password/send-otp', { email });
      toast.success('OTP resent to your email.');
      setResendCooldown(60); // 60-second cooldown
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await AxiosInstances.post('/user/forgot-password/verify', {
        email,
        otp,
        newPassword,
      });

      toast.success('Password reset successful. Please log in.');
      localStorage.removeItem('resetEmail');
      navigate('/signin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-semibold text-center ">Reset Your Password</h2>
        <p className='mb-4 text-sm text-center'>OTP has been sent to <span className="font-medium text-green-600">{email}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            className="w-full border rounded-lg p-2"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Didn’t receive an OTP?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className={`text-blue-600 font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed`}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
          <input
            type="password"
            placeholder="New Password"
            className="w-full border rounded-lg p-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full border rounded-lg p-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
