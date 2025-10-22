import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { Loader2 } from 'lucide-react';
import AxiosInstances from '../apiManager';
import NavBar from '../components/NavBar';
import { toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Signup = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await AxiosInstances.post('/user/register', data);
            toast.success(response?.data?.message || 'OTP sent to your email');
            sessionStorage.setItem('authEmail', data.email);
            reset();
            navigate('/verify-otp', { state: { role: 'user', isLoginFlow: false } });
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'An unexpected error occurred.');
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
                        <h1 className='text-3xl font-extrabold text-gray-900'>Get Started 🚀</h1>
                        <p className='mt-2 text-gray-600'>Create your account to get started</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='mb-4'>
                            <input
                                type="text"
                                placeholder='Full Name'
                                className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                    }`}
                                {...register("name", { required: "Name is required" })}
                            />
                            {errors.name && <p className='mt-1 text-xs text-red-600'>{errors.name.message}</p>}
                        </div>

                        <div className='mb-4'>
                            <input
                                type="email"
                                placeholder='Email Address'
                                className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                    }`}
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,4}$/i,
                                        message: "Invalid email address"
                                    }
                                })}
                            />
                            {errors.email && <p className='mt-1 text-xs text-red-600'>{errors.email.message}</p>}
                        </div>

                        <div className='mb-4'>
                            <input
                                type="tel"
                                placeholder='Phone Number'
                                className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                    }`}
                                {...register("phone", {
                                    required: "Phone number is required",
                                    pattern: {
                                        value: /^[6-9][0-9]{9}$/,
                                        message: "Phone number must be exactly 10 digits"
                                    }
                                })}
                            />
                            {errors.phone && <p className='mt-1 text-xs text-red-600'>{errors.phone.message}</p>}
                        </div>

                        <div className='mb-6 relative'>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder='Password'
                                className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                    }`}
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: {
                                        value: 8,
                                        message: "Password must be at least 8 characters long"
                                    }
                                })}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-xl text-gray-500 focus:outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            {errors.password && <p className='mt-1 text-xs text-red-600'>{errors.password.message}</p>}
                        </div>

                        <button
                            type='submit'
                            disabled={isLoading}
                            className='h-12 px-4 text-white bg-blue-600 font-bold rounded-lg w-full mb-4 hover:bg-blue-700 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed'
                        >
                            {isLoading ? (
                                <div className='flex items-center justify-center gap-2'>
                                    <Loader2 className='w-5 h-5 animate-spin' />
                                    <span>Creating account...</span>
                                </div>
                            ) : (
                                'Sign Up'
                            )}
                        </button>

                        <p className='text-center text-gray-600'>
                            Already have an account?
                            <NavLink to="/signin" className="text-blue-600 font-semibold hover:underline ml-1">
                                Sign In
                            </NavLink>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;