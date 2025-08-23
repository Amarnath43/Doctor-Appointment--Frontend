import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../store/user';
import { setToken } from '../helper';
import AxiosInstances from '../apiManager';

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserStore();

  // pass { role: 'doctor' | 'user', isLoginFlow: boolean } when navigating to this page
  const role = location.state?.role || 'user';
  const isLoginFlow = location.state?.isLoginFlow || false;

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // pick endpoints based on role
  const VERIFY_ENDPOINT = '/user/verify-otp';
  const RESEND_ENDPOINT = role === 'doctor' ? '/doctor/resend-otp' : '/user/resend-otp';

  useEffect(() => {
    const storedEmail = localStorage.getItem('authEmail');
    if (!storedEmail) {
      toast.error('Email not found. Please start again.');
      navigate(isLoginFlow ? '/signin' : role === 'doctor' ? '/doctor/register' : '/user/register');
    } else {
      setEmail(storedEmail);
    }
  }, [navigate, isLoginFlow, role]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      return toast.error('OTP must be 6 digits');
    }

    setIsSubmitting(true);
    try {
      const res = await AxiosInstances.post(VERIFY_ENDPOINT, {
        email,
        otp,
        isLoginFlow
      });

      toast.success(res.data.message);

      if (isLoginFlow && res.data.token) {
        setToken(res.data.token);
        localStorage.removeItem('authEmail');
        setUser(res.data.user);

        // redirect based on role from backend
        const r = res.data.user?.role;
        const s=res.data.user?.status;
        if (r === 'doctor') navigate('/doctor/home');
        else if (r === 'admin' ) navigate('/admin/home');
        else navigate('/')
        
      } else {
        // signup flow -> go to signin
        localStorage.removeItem('authEmail');
        navigate('/signin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await AxiosInstances.post(RESEND_ENDPOINT, {
        email,
        isLoginFlow,
      });
      toast.success('OTP resent to your email');
      setCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-center mb-2">Enter OTP</h2>
        <p className="text-center text-sm text-gray-500 mb-4">
          We&apos;ve sent an OTP to your email. Enter it below to continue.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            placeholder="Enter 6-digit OTP"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
          </button>
          <div className="text-sm text-center mt-2">
            Didn&apos;t get the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-blue-600 font-semibold hover:underline disabled:text-gray-400"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
