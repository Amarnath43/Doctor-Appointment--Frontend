import React, { useState, useEffect, useRef } from 'react';

import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { Loader2 } from 'lucide-react';
import AxiosInstances from '../apiManager';
import NavBar from '../components/NavBar';
import { toast } from 'react-hot-toast';

const Signup = () => {
    const navigate = useNavigate();
    const { role } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [matches, setMatches] = useState([]);
    const [showExtras, setShowExtras] = useState(false);
    const [query, setQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
  requestAnimationFrame(() => {
    console.log('[load]', {
      hash: window.location.hash,
      scrollY: window.scrollY,
      active: document.activeElement?.tagName,
      activeName: document.activeElement?.getAttribute?.('name'),
    });
  });
}, []);



    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm();

    const hospitalId = watch("hospitalId");

    const onSubmit = async (data) => {
        // If hospitalId is empty, require all new-hospital fields
        if (!data.hospitalId) {
            const missing =
                !data.hospitalName ||
                !data.hospitalPhoneNumber ||
                !data.location ||
                !data.googleMapsLink;
            if (missing) {
                toast.error("Select a hospital from the list or fill all hospital details.");
                return;
            }
        }

        setIsLoading(true);
        try {
            const response = await AxiosInstances.post('/doctor/send-otp', {
                ...data,
                email: (data.email || '').toLowerCase()
            });
            toast.success(response?.data?.message || 'OTP sent to your email.');
            localStorage.setItem('authEmail', (data.email || '').toLowerCase());
            reset();
            navigate('/verify-otp', { state: { role: 'doctor', isLoginFlow: false } });
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        // Clear results when empty
        if (!query.trim()) {
            setMatches([]);
            setShowExtras(false);
            return;
        }

        // Only search from 2+ chars
        if (query.trim().length < 2) {
            setMatches([]);
            setShowExtras(false);
            return;
        }

        const controller = new AbortController();   // cancel stale requests
        const timer = setTimeout(async () => {
            try {
                setLoadingHospitals(true);
                const res = await AxiosInstances.get('/user/hospitals-register', {
                    params: { q: query.trim(), limit: 8 },
                    signal: controller.signal
                });
                const list = res?.data?.hospitals || [];
                setMatches(list);
                setShowExtras(query.trim().length >= 2 &&
                    !loadingHospitals &&
                    list.length === 0);
                const active = document.activeElement;
                if (active && active.getAttribute('name') === 'hospitalName') {
                    setIsDropdownOpen(true);
                }
            } catch (err) {
                // ignore cancels; log others
                if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                    console.error('Hospital search error:', err);
                }
            } finally {
                setLoadingHospitals(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);
    const blurTimeoutRef = useRef();

    const onHospitalBlur = () => {
        blurTimeoutRef.current = setTimeout(() => setIsDropdownOpen(false), 150);
    };
    const onHospitalFocus = () => {
        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
        if (matches.length > 0) setIsDropdownOpen(true);
    };

    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
        };
    }, []);


    const onHospitalInput = (e) => {
        const val = e.target.value;
        setQuery(val);
        setValue('hospitalName', val);
        setValue('hospitalId', '');
        if (!val) setIsDropdownOpen(false);
    };

    const pickHospital = (h) => {
        setValue('hospitalName', h.name);
        setValue('hospitalId', h._id);
        setMatches([]);
        setShowExtras(false);
        setQuery(h.name);
        setIsDropdownOpen(false);
    };





    return (
        <div className='min-h-screen bg-gray-50 flex flex-col px-4 sm:px-20 py-3'>
            <NavBar />
            <div className='flex-1 flex justify-center items-center p-4 sm:p-6'>
                <div className='bg-white w-full max-w-lg px-8 py-8 rounded-2xl shadow-xl border border-gray-200'>
                    <div className='text-center mb-6'>
                        <h1 className='text-3xl font-extrabold text-gray-900'>Get Started 🚀</h1>
                        <p className='mt-2 text-gray-600'>Register as a doctor</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

                            <input type="hidden" {...register('hospitalId')} />
                            {/* Name field */}
                            <div className='mb-2 md:mb-0'>
                                <input
                                    type="text"
                                    placeholder='Full Name'
                                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                        }`}
                                    {...register("name", { required: "Name is required" })}
                                />
                                {errors.name && <p className='mt-1 text-xs text-red-600'>{errors.name.message}</p>}
                            </div>

                            {/* Email field */}
                            <div className='mb-2 md:mb-0'>
                                <input
                                    type="email"
                                    placeholder='Email Address'
                                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                        }`}
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: {
                                            value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                            message: "Invalid email address"
                                        }
                                    })}
                                />
                                {errors.email && <p className='mt-1 text-xs text-red-600'>{errors.email.message}</p>}
                            </div>

                            {/* Phone number field */}
                            <div className='mb-2 md:mb-0'>
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

                            {/* Password field */}
                            <div className='mb-2 md:mb-0'>
                                <input
                                    type="password"
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
                                {errors.password && <p className='mt-1 text-xs text-red-600'>{errors.password.message}</p>}
                            </div>

                            {/* Specialization field */}
                            <div className='mb-2 md:mb-0'>
                                <input
                                    type="text"
                                    placeholder='Specialization'
                                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.specialization ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                        }`}
                                    {...register("specialization", { required: "Specialization is required", minLength: { value: 4, message: "Specialization must be at least 4 characters long" } })}
                                />
                                {errors.specialization && <p className='mt-1 text-xs text-red-600'>{errors.specialization.message}</p>}
                            </div>

                            {/* Experience field */}
                            <div className='mb-2 md:mb-0'>
                                <input
                                    type="number"
                                    placeholder='Experience (in years)'
                                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.experience ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                        }`}
                                    {...register("experience", { required: "Experience is required" })}
                                />
                                {errors.experience && <p className='mt-1 text-xs text-red-600'>{errors.experience.message}</p>}
                            </div>

                            {/* Fee field */}
                            <div className='mb-2 md:mb-0'>
                                <input
                                    type="number"
                                    placeholder='Consultation Fee'
                                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.fee ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                        }`}
                                    {...register("fee", { required: "Fee is required" })}
                                />
                                {errors.fee && <p className='mt-1 text-xs text-red-600'>{errors.fee.message}</p>}
                            </div>

                            {/* Bio field (updated to textarea) */}
                            <div className='mb-2 md:mb-0 md:col-span-2'>
                                <textarea
                                    placeholder='Short Bio'
                                    rows={2}
                                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none ${errors.bio ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                        }`}
                                    {...register("bio", { required: "Bio is required" })}
                                />
                                {errors.bio && <p className='mt-1 text-xs text-red-600'>{errors.bio.message}</p>}
                            </div>

                            {/* Hospital Name with Autocomplete */}
                            <div className='mb-2 md:mb-0 relative md:col-span-2'>
                                <input
                                    type="text"
                                    placeholder='Hospital Name'
                                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.hospitalName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                        }`}
                                    {...register("hospitalName", { required: "Hospital name is required" })}

                                    onChange={onHospitalInput}
                                    onBlur={onHospitalBlur}
                                    onFocus={onHospitalFocus}
                                    autoComplete="off"
                                />
                                {errors.hospitalName && <p className='mt-1 text-xs text-red-600'>{errors.hospitalName.message}</p>}
                                {isDropdownOpen && (loadingHospitals || matches.length > 0 || (query && !loadingHospitals)) && (
                                    <ul className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg shadow-md z-20 bg-white max-h-40 overflow-y-auto">
                                        {loadingHospitals && (
                                            <li className="px-4 py-2 text-sm text-gray-500">Searching…</li>
                                        )}
                                        {!loadingHospitals && matches.length > 0 && matches.map(h => (
                                            <li
                                                key={h._id}
                                                className="px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors"
                                                onMouseDown={() => pickHospital(h)}  // fires before blur
                                            >
                                                {h.name}, {h.location}
                                            </li>
                                        ))}
                                        {!loadingHospitals && query && matches.length === 0 && (
                                            <li className="px-4 py-2 text-sm text-gray-500">No hospitals found</li>
                                        )}
                                    </ul>
                                )}



                            </div>
                        </div>

                        {/* Additional Hospital Details (visible if hospital not found) */}
                        {(showExtras && !hospitalId) && (
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='mb-2 md:mb-0'>
                                    <input
                                        type="tel"
                                        placeholder='Hospital Phone Number'
                                        className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.hospitalPhoneNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                            }`}
                                        {...register("hospitalPhoneNumber", {
                                            required: "Hospital Phone number is required",
                                            pattern: {
                                                value: /^[6-9][0-9]{9}$/,
                                                message: "Phone number must be exactly 10 digits"
                                            }
                                        })}
                                    />
                                    {errors.hospitalPhoneNumber && <p className='mt-1 text-xs text-red-600'>{errors.hospitalPhoneNumber.message}</p>}
                                </div>
                                <div className='mb-2 md:mb-0'>
                                    <input
                                        type="text"
                                        placeholder='Hospital Location'
                                        className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.location ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                            }`}
                                        {...register('location', {
                                            required: "Hospital Location is required",
                                            minLength: { value: 4, message: "Hospital Location must be at least 4 characters long" }
                                        })}
                                    />
                                    {errors.location && <p className='mt-1 text-xs text-red-600'>{errors.location.message}</p>}
                                </div>
                                <div className='mb-2 md:mb-0 md:col-span-2'>
                                    <input
                                        type="text"
                                        placeholder='Google Maps Link'
                                        className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.googleMapsLink ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                                            }`}
                                        {...register('googleMapsLink', {
                                            required: "Google Maps Link is required",
                                            pattern: {
                                                value: /^(https?:\/\/)?(www\.)?google\.com\/maps\/.*$/i,
                                                message: "Invalid Google Maps link"
                                            }
                                        })}
                                    />
                                    {errors.googleMapsLink && <p className='mt-1 text-xs text-red-600'>{errors.googleMapsLink.message}</p>}
                                </div>
                            </div>
                        )}
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='h-12 px-4 text-white bg-green-600 font-bold rounded-lg w-full mt-4 hover:bg-green-700 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed'
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
                            <NavLink to="/signin" className="text-green-600 font-semibold hover:underline ml-1">
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