import React, { useState, useEffect} from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AxiosInstances from '../apiManager';
import { toast } from 'react-hot-toast';
import NavBar from '../components/NavBar';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Signin = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState({});
    const navigate = useNavigate();
     const location = useLocation();

     useEffect(() => {

    const flash = location.state?.flash;
    if (flash?.msg) {
      (flash.type === 'success' ? toast.success : toast.error)(flash.msg);
      window.history.replaceState({}, document.title);
    }

    const pending = sessionStorage.getItem('pendingBooking');
    if (pending) {
      toast.error('Please login to book');
    }
  }, [location.state]);

    const onSubmit = async (raw) => {
  setIsLoading(true);
  setServerError({});

  const payload = {
    email: String(raw.email || '').trim().toLowerCase(),
    password: raw.password,
  };

  try {

    const response = await AxiosInstances.post('/user/signin', payload);
    const role = response?.data?.role === 'doctor' ? 'doctor' : 'user';
    toast.success(response?.data?.message || 'OTP sent to your email');
    sessionStorage.setItem('authEmail', payload.email);
    navigate('/verify-otp', { state: { role, isLoginFlow: true } });
  } catch (e) {
    if (e.response?.data) {
      const { field, message } = e.response.data;
      setServerError({ [field]: message });
      toast.error(message);
    } else {
      toast.error('An unexpected error occurred.');
    }
  } finally {
    setIsLoading(false);
  }
};


return (
    <div className='min-h-screen bg-gray-50 flex flex-col px-4 sm:px-20 py-3'>
        <NavBar />
        <div className='flex-1 flex justify-center items-center p-4 sm:p-6'>
            <div className='bg-white w-full max-w-md px-8 py-8 rounded-2xl shadow-xl border border-gray-200'>
                <div className='text-center mb-6'>
                    <h1 className='text-3xl font-extrabold text-gray-900'>Welcome Back 👋</h1>
                    <p className='mt-2 text-gray-600'>Sign in to access your account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='mb-4'>
                        <input
                            type='email'
                            placeholder='Email address'
                            className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${(errors.email || serverError.email)
                                    ? 'border-red-500 focus:ring-red-200'
                                    : 'border-gray-300 focus:ring-green-200'
                                }`}
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,4}$/i,
                                    message: 'Invalid email address'
                                }
                            })}
                        />
                        {(errors.email || serverError.email) && (
                            <p className='mt-1 text-xs text-red-600'>
                                {errors.email?.message || serverError.email}
                            </p>
                        )}
                    </div>

                    <div className='mb-4'>
                        <input
                            type='password'
                            placeholder='Password'
                            className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${(errors.password || serverError.password)
                                    ? 'border-red-500 focus:ring-red-200'
                                    : 'border-gray-300 focus:ring-green-200'
                                }`}
                            {...register('password', {
                                required: 'Password is mandatory',
                                minLength: {
                                    value: 8,
                                    message: 'Password must be at least 8 characters'
                                }
                            })}
                        />
                        {(errors.password || serverError.password) && (
                            <p className='mt-1 text-xs text-red-600'>
                                {errors.password?.message || serverError.password}
                            </p>
                        )}
                    </div>

                    <button
                        type='submit'
                        disabled={isLoading}
                        className='h-12 px-4 text-white bg-green-600 font-bold rounded-lg w-full mt-4 hover:bg-green-700 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed'
                    >
                        {isLoading ? (
                            <div className='flex items-center justify-center gap-2'>
                                <Loader2 className='w-5 h-5 animate-spin' />
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <div className='mt-4 text-center'>
                        <p className='text-gray-600'>
                            Don’t have an account?
                            <NavLink to='/user/register' className='text-green-600 font-semibold hover:underline ml-1'>
                                Sign Up
                            </NavLink>
                        </p>
                        <NavLink to='/forgot-password' className='text-green-600 font-semibold hover:underline mt-2 inline-block'>
                            Forgot Password?
                        </NavLink>
                    </div>
                </form>
            </div>
        </div>
    </div>
);
};

export default Signin;