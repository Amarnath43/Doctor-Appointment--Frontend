import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import AxiosInstances from '../apiManager';
import NavBar from '../components/NavBar';
import { toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash } from "react-icons/fa";

/** Simple debounce hook */
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitalMatches, setHospitalMatches] = useState([]);
  const [showAddNewHospital, setShowAddNewHospital] = useState(false);
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebounced(hospitalQuery.trim(), 300);
  const dropdownRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onTouched', // Show errors as user interacts
  });

  const hospitalId = watch('hospitalId');

  /** Debounced hospital search */
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setHospitalMatches([]);
      setShowAddNewHospital(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoadingHospitals(true);
        const res = await AxiosInstances.get('/user/hospitals-register', {
          params: { q: debouncedQuery, limit: 8 },
          signal: controller.signal,
        });
        const hospitals = res?.data?.hospitals || [];
        setHospitalMatches(hospitals);
        // Only auto-prompt add-new when truly no matches
        setShowAddNewHospital(hospitals.length === 0);
        setActiveIndex(hospitals.length ? 0 : -1);
      } catch (err) {
        // axios abort on fetch() sets name to 'AbortError', axios cancellation can be 'CanceledError'
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error('Hospital search error:', err);
        }
      } finally {
        setLoadingHospitals(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  /** Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onHospitalInput = (e) => {
    const value = e.target.value;
    setHospitalQuery(value);
    setValue('hospitalName', value, { shouldValidate: true, shouldDirty: true });
    setValue('hospitalId', '', { shouldValidate: true, shouldDirty: true }); // Clear selected ID when user types
    setShowAddNewHospital(false); // Hide extra fields while typing
    setActiveIndex(-1);
    if (value) setIsDropdownOpen(true);
  };

  const pickHospital = (hospital) => {
    setValue('hospitalName', hospital.name, { shouldValidate: true, shouldDirty: true });
    setValue('hospitalId', hospital._id, { shouldValidate: true, shouldDirty: true });
    setHospitalQuery(hospital.name);
    setHospitalMatches([]);
    setShowAddNewHospital(false);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
  };

  const onSubmit = async (data) => {
    if (isLoading) return; // Prevent double submit

    // If hospitalId is empty, require all new-hospital fields
    if (!data.hospitalId) {
      const missing =
        !data.hospitalName ||
        !data.hospitalPhoneNumber ||
        !data.location ||
        !data.googleMapsLink;
      if (missing) {
        toast.error('Select a hospital from the list or fill all hospital details.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        // sanitize/trim
        name: data.name?.trim(),
        specialization: data.specialization?.trim(),
        hospitalName: data.hospitalName?.trim(),
        location: data.location?.trim(),
        googleMapsLink: data.googleMapsLink?.trim(),
        email: (data.email || '').trim().toLowerCase(),
      };

      const response = await AxiosInstances.post('/doctor/send-otp', payload);
      toast.success(response?.data?.message || 'OTP sent to your email.');

      // Prefer session storage for short-lived PII
      sessionStorage.setItem('authEmail', (data.email || '').trim().toLowerCase());

      reset();
      navigate('/verify-otp', { state: { role: 'doctor', isLoginFlow: false } });
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for conditional validation rules
  const isNewHospital = !hospitalId && showAddNewHospital;

  /** Keyboard navigation for the combobox */
  const onHospitalKeyDown = (e) => {
    if (!isDropdownOpen || loadingHospitals) return;

    const hasMatches = hospitalMatches.length > 0;
    const lastIndex = Math.max(hospitalMatches.length - 1, 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hasMatches) {
        setActiveIndex((i) => (i < 0 ? 0 : Math.min(i + 1, lastIndex)));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hasMatches) {
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && hasMatches) {
        e.preventDefault();
        pickHospital(hospitalMatches[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-4 sm:px-20 py-3">
      <NavBar />
      <div className="flex-1 flex justify-center items-center p-4 sm:p-6">
        <div className="bg-white w-full max-w-lg px-8 py-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">Get Started 🚀</h1>
            <p className="mt-2 text-gray-600">Register as a doctor</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="hidden" {...register('hospitalId')} />

              <InputField
                name="name"
                placeholder="Full Name"
                errors={errors}
                register={register}
                rules={{ required: 'Name is required' }}
              />
              <InputField
                name="email"
                type="email"
                placeholder="Email Address"
                errors={errors}
                register={register}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email',
                  },
                }}
              />
              <InputField
                name="phone"
                type="tel"
                placeholder="Phone Number"
                errors={errors}
                register={register}
                rules={{
                  required: 'Phone is required',
                  pattern: { value: /^[6-9][0-9]{9}$/, message: 'Invalid phone number' },
                }}
              />
              <div className=' relative'>
                <InputField
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  errors={errors}
                  register={register}
                  rules={{
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    validate: {
                      hasNum: (v) => /\d/.test(v) || 'Include a number',
                      hasLetter: (v) => /[A-Za-z]/.test(v) || 'Include a letter',
                    },
                  }}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-xl text-gray-500 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  }
                />
               
              </div>

              <InputField
                name="specialization"
                placeholder="Specialization"
                errors={errors}
                register={register}
                rules={{ required: 'Specialization is required' }}
                className="md:col-span-2"
              />
              <InputField
                name="experience"
                type="number"
                placeholder="Experience (in years)"
                errors={errors}
                register={register}
                rules={{
                  required: 'Experience is required',
                  min: { value: 0, message: 'Must be ≥ 0' },
                  max: { value: 80, message: 'Unusually high' },
                  valueAsNumber: true,
                }}
              />
              <InputField
                name="fee"
                type="number"
                placeholder="Consultation Fee"
                errors={errors}
                register={register}
                rules={{
                  required: 'Fee is required',
                  min: { value: 0, message: 'Must be ≥ 0' },
                  valueAsNumber: true,
                }}
              />

              {/* Bio */}
              <div className="md:col-span-2">
                <textarea
                  placeholder="Short Bio"
                  rows={2}
                  className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none ${errors.bio ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'
                    }`}
                  {...register('bio', { required: 'Bio is required' })}
                />
                {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>}
              </div>

              {/* Hospital Autocomplete */}
              <div className="relative md:col-span-2" ref={dropdownRef}>
                <InputField
                  name="hospitalName"
                  placeholder="Search for your Hospital..."
                  errors={errors}
                  register={register}
                  rules={{ required: 'Hospital name is required' }}
                  onChange={onHospitalInput}
                  onFocus={() => hospitalQuery && setIsDropdownOpen(true)}
                  onKeyDown={onHospitalKeyDown}
                  autoComplete="off"
                  // ARIA
                  role="combobox"
                  aria-expanded={isDropdownOpen}
                  aria-controls="hospital-options"
                  aria-autocomplete="list"
                />

                {isDropdownOpen && (
                  <ul
                    id="hospital-options"
                    role="listbox"
                    className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg shadow-lg z-20 bg-white max-h-60 overflow-y-auto"
                  >
                    {loadingHospitals && (
                      <li className="px-4 py-2 text-sm text-gray-500">Searching…</li>
                    )}

                    {!loadingHospitals &&
                      hospitalMatches.map((h, idx) => (
                        <li
                          key={h._id}
                          onMouseDown={() => pickHospital(h)}
                          className={`px-4 py-2 text-sm text-gray-800 cursor-pointer ${activeIndex === idx ? 'bg-gray-100' : 'hover:bg-gray-100'
                            }`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          {h.name}, {h.location}
                        </li>
                      ))}

                    {/* Explicit "Add new" action even when matches exist */}
                    {!loadingHospitals && !!hospitalMatches.length && (
                      <li
                        className="px-4 py-2 text-sm text-green-700 hover:bg-green-50 cursor-pointer border-t"
                        onMouseDown={() => {
                          setShowAddNewHospital(true);
                          setIsDropdownOpen(false);
                          setValue('hospitalId', '', { shouldValidate: true });
                        }}
                      >
                        Can’t find it? Add new hospital
                      </li>
                    )}

                    {/* When there are zero matches */}
                    {!loadingHospitals && showAddNewHospital && !hospitalMatches.length && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 border border-green-200 bg-green-50 rounded-lg">
                <p className="md:col-span-2 text-sm font-semibold text-green-800">
                  Add New Hospital Details
                </p>

                <InputField
                  name="hospitalPhoneNumber"
                  type="tel"
                  placeholder="Hospital Phone"
                  errors={errors}
                  register={register}
                  rules={{
                    required: { value: isNewHospital, message: 'Phone is required' },
                  }}
                />
                <InputField
                  name="location"
                  placeholder="Hospital Location"
                  errors={errors}
                  register={register}
                  rules={{
                    required: { value: isNewHospital, message: 'Location is required' },
                  }}
                />

                <InputField
                  name="googleMapsLink"
                  placeholder="Google Maps Link"
                  errors={errors}
                  register={register}
                  rules={{
                    required: { value: isNewHospital, message: 'Link is required' },
                    pattern: {
                      value:
                        /^(https?:\/\/)?(maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.[a-z.]+\/maps)(\/|$)/i,
                      message: 'Invalid Google Maps link',
                    },
                  }}
                  className="md:col-span-2"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 px-4 text-white bg-blue-600 font-bold rounded-lg w-full mt-4 hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Sign Up'
              )}
            </button>

            <p className="text-center text-gray-600">
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

const InputField = ({
  name,
  type = 'text',
  placeholder,
  errors = {},
  register,
  rules,
  className = '',
  endAdornment, // ⬅️ new: pass a button/icon here
  inputClassName = '',
  ...props
}) => {
  const hasError = Boolean(errors?.[name]);

  return (
    <div className={className}>
      {/* Wrap ONLY the input and the icon in a relative box */}
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2
            ${hasError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-green-200'}
            pr-10  /* reserve room for the eye */ 
            ${inputClassName}`}
          {...register(name, rules)}
          {...props}
        />

        {/* Absolutely position the toggle inside the input's box */}
        {endAdornment && (
          <div
            className="absolute inset-y-0 right-3 flex items-center"
          /* inset-y-0 + flex centers it vertically by the input's height, 
             not the container that grows with the error text */
          >
            {endAdornment}
          </div>
        )}
      </div>

      {hasError && (
        <p className="mt-1 text-xs text-red-600">
          {errors[name].message}
        </p>
      )}
    </div>
  );
};


export default Signup;
