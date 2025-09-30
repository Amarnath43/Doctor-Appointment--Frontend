import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { Loader2 } from 'lucide-react';
import AxiosInstances from '../apiManager';
import NavBar from '../components/NavBar';
import { toast } from 'react-hot-toast';

const Signup = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [hospitalMatches, setHospitalMatches] = useState([]);
    const [showAddNewHospital, setShowAddNewHospital] = useState(false);
    const [hospitalQuery, setHospitalQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNormalizing, setIsNormalizing] = useState(false);


    const dropdownRef = useRef(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        mode: 'onTouched' // Show errors as user interacts
    });

    const hospitalId = watch("hospitalId");

    // This effect handles the debounced search for hospitals
    useEffect(() => {
        if (hospitalQuery.trim().length < 2) {
            setHospitalMatches([]);
            setShowAddNewHospital(false);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setLoadingHospitals(true);
                const res = await AxiosInstances.get('/user/hospitals-register', {
                    params: { q: hospitalQuery.trim(), limit: 8 },
                    signal: controller.signal
                });
                const hospitals = res?.data?.hospitals || [];
                setHospitalMatches(hospitals);
                // Show "add new" button only if search is complete and no matches are found
                setShowAddNewHospital(hospitals.length === 0);
            } catch (err) {
                if (err.name !== 'CanceledError') {
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
    }, [hospitalQuery]);

    // This effect handles clicking outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onHospitalInput = (e) => {
        const value = e.target.value;
        setHospitalQuery(value);
        setValue('hospitalName', value);
        setValue('hospitalId', ''); // Clear selected ID when user types
        setShowAddNewHospital(false); // Hide extra fields while typing
        if (value) {
            setIsDropdownOpen(true);
        }
    };

    const pickHospital = (hospital) => {
        setValue('hospitalName', hospital.name);
        setValue('hospitalId', hospital._id);
        setHospitalQuery(hospital.name);
        setHospitalMatches([]);
        setShowAddNewHospital(false);
        setIsDropdownOpen(false);
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                email: (data.email || '').toLowerCase().trim(),
                // optional: coerce numbers
                experience: Number(data.experience),
                fee: Number(data.fee),
            };

            // match the UI condition for "add new hospital"
            const creatingNewHospital = !hospitalId && showAddNewHospital;

              if (!payload.hospitalId) delete payload.hospitalId;

            if (creatingNewHospital) {
                if (!payload.googleMapsLink) {
                    toast.error('Please provide a Google Maps link.');
                    setIsLoading(false);
                    return;
                }

                try {
                    setIsNormalizing(true);
                    const { data: canon } = await AxiosInstances.post('/utils/canonical-maps-link', {
                        url: payload.googleMapsLink,
                    });
                    setIsNormalizing(false);

                    if (!canon?.canonicalUrl) {
                        toast.error('Could not validate Google Maps link. Please check the URL.');
                        setIsLoading(false);
                        return;
                    }

                    // Replace raw link with the stable one
                    payload.googleMapsLink = canon.canonicalUrl;
                } catch (err) {
                    console.error('Canonicalize error:', err);
                    setIsNormalizing(false);
                    toast.error('Failed to validate the Google Maps link.');
                    setIsLoading(false);
                    return;
                }
            }

            // proceed with your existing flow
            const response = await AxiosInstances.post('/doctor/send-otp', payload);

            toast.success(response?.data?.message || 'OTP sent to your email.');
            localStorage.setItem('authEmail', payload.email);
            reset();
            navigate('/verify-doctor-otp', { state: { role: 'doctor', isLoginFlow: false } });
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };



    // Helper for conditional validation rules
    const isNewHospital = !hospitalId && showAddNewHospital;

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

                            {/* Personal Info */}
                            <InputField name="name" placeholder="Full Name" errors={errors} register={register} rules={{ required: "Name is required" }} />
                            <InputField name="email" type="email" placeholder="Email Address" errors={errors} register={register} rules={{ required: "Email is required", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email" } }} />
                            <InputField name="phone" type="tel" placeholder="Phone Number" errors={errors} register={register} rules={{ required: "Phone is required", pattern: { value: /^[6-9][0-9]{9}$/, message: "Invalid phone number" } }} />
                            <InputField name="password" type="password" placeholder="Password" errors={errors} register={register} rules={{ required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } }} />
                            <InputField name="specialization" placeholder="Specialization" errors={errors} register={register} rules={{ required: "Specialization is required" }} className="md:col-span-2" />
                            <InputField name="experience" type="number" placeholder="Experience (in years)" errors={errors} register={register} rules={{ required: "Experience is required" }} />
                            <InputField name="fee" type="number" placeholder="Consultation Fee" errors={errors} register={register} rules={{ required: "Fee is required" }} />

                            {/* Bio */}
                            <div className='md:col-span-2'>
                                <textarea
                                    placeholder='Short Bio'
                                    rows={2}
                                    className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none ${errors.bio ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'}`}
                                    {...register("bio", { required: "Bio is required" })}
                                />
                                {errors.bio && <p className='mt-1 text-xs text-red-600'>{errors.bio.message}</p>}
                            </div>

                            {/* Hospital Autocomplete */}
                            <div className='relative md:col-span-2' ref={dropdownRef}>
                                <InputField
                                    name="hospitalName"
                                    placeholder="Search for your Hospital..."
                                    errors={errors}
                                    register={register}
                                    rules={{ required: "Hospital name is required" }}
                                    onChange={onHospitalInput}
                                    onFocus={() => hospitalQuery && setIsDropdownOpen(true)}
                                    autoComplete="off"
                                />
                                {isDropdownOpen && (
                                    <ul className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg shadow-lg z-20 bg-white max-h-48 overflow-y-auto">
                                        {loadingHospitals && <li className="px-4 py-2 text-sm text-gray-500">Searching…</li>}
                                        {!loadingHospitals && hospitalMatches.map(h => (
                                            <li key={h._id} onMouseDown={() => pickHospital(h)} className="px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer">
                                                {h.name}, {h.location}
                                            </li>
                                        ))}
                                        {!loadingHospitals && showAddNewHospital && (
                                            <li className="px-4 py-2 text-sm text-center text-gray-500">
                                                No hospitals found. Please add details below.
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Conditional "Add New Hospital" Fields */}
                        {showAddNewHospital && !hospitalId && (
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 border border-green-200 bg-green-50 rounded-lg'>
                                <p className='md:col-span-2 text-sm font-semibold text-green-800'>Add New Hospital Details</p>
                                <InputField name="hospitalPhoneNumber" type="tel" placeholder="Hospital Phone" errors={errors} register={register} rules={{ required: { value: isNewHospital, message: "Phone is required" } }} />
                                <InputField name="location" placeholder="Hospital Location" errors={errors} register={register} rules={{ required: { value: isNewHospital, message: "Location is required" } }} />
                                {/* Replace the googleMapsLink rules with this */}
                                <InputField
                                    name="googleMapsLink"
                                    placeholder="Google Maps Link"
                                    errors={errors}
                                    register={register}
                                    rules={{
                                        required: { value: isNewHospital, message: "Link is required" },
                                        pattern: {
                                            value: /^(https?:\/\/)?(maps\.app\.goo\.gl|www\.google\.(com|[a-z.]+)\/maps)\/?/i,
                                            message: "Invalid Google Maps link"
                                        }
                                    }}
                                    className="md:col-span-2"
                                />

                            </div>
                        )}

                        <button
                            type='submit'
                            disabled={isLoading || isNormalizing}
                            className='h-12 px-4 text-white bg-green-600 font-bold rounded-lg w-full mt-4 hover:bg-green-700 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                        >
                            {isLoading || isNormalizing ? (
                                <>
                                    <Loader2 className='w-5 h-5 animate-spin' />
                                    <span>{isNormalizing ? 'Validating Maps link…' : 'Creating Account...'}</span>
                                </>
                            ) : 'Sign Up'}
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

// Reusable Input Field component for cleaner form code
const InputField = ({ name, type = 'text', placeholder, errors, register, rules, className = '', ...props }) => (
    <div className={className}>
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 ${errors[name] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'}`}
            {...register(name, rules)}
            {...props}
        />
        {errors[name] && <p className='mt-1 text-xs text-red-600'>{errors[name].message}</p>}
    </div>
);

export default Signup;
