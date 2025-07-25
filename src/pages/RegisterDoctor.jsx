import React, { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useParams } from 'react-router-dom';
import { useForm } from "react-hook-form"
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstances from '../apiManager';

const Signup = () => {
    const navigate = useNavigate();
    const { role } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError,setServerError]=useState({});

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm()

    const onSubmit = async (data) => {
        setIsLoading(true);
        console.log("data", data)
        try {
            const response = await AxiosInstances.post('/doctor/register', data)
            console.log(response);
            navigate('/signin')
        }
        catch (e) {
            console.log(e);
            

        }
        finally {
            setIsLoading(false)
        }
    };
    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState(null)
    const [showExtras, setShowExtras] = useState(false);
    const [matches, setMatches] = useState([])
    useEffect(() => {
        const fetchHospitals = async () => {


            try {
                let response = await AxiosInstances.get('/user/allhospitals');
                console.log(response?.data?.hospitals);
                setHospitals(response?.data?.hospitals || []);


            }
            catch (err) {
                console.error('Failed to load hospitals', err)

            } finally {
                setLoadingHospitals(false)
            }
        }
        fetchHospitals();
    }, []);

    const onHospitalInput = (e) => {
        const q = e.target.value;
        setValue('hospitalName', q);
        if (!q) {
            setShowExtras(false);
            setMatches([]);
            setSelectedHospital(null);
            return;
        }
        const found = hospitals.filter((h) => h.name.toLowerCase().includes(q.toLowerCase()));
        setMatches(found);
        setShowExtras(found.length === 0);
        setSelectedHospital(null)


    }

    const pickHospital = (h) => {
        setValue('hospitalName', h.name);
        setSelectedHospital(h);
        setMatches([]);
        setShowExtras(false)
    }

    return (
        <div className="relative min-h-screen bg-[url('/bg-register-doctor.jpg')] bg-cover bg-center">
            <div className='absolute inset-0 bg-black/50'></div>
            <div className=' relative z-10 flex justify-center items-center min-h-screen overflow-auto'>
                <div className=' bg-white text-center px-6 py-8 rounded-xl '>
                    <h1 className='font-bold md:text-3xl text-xl text-gray-800 mb-4'>
                        Register as Doctor
                    </h1>
                    <p className='text-gray-600 mb-3 text-sm md:text-lg'>Sign in to access your account</p>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className='flex flex-col justify-center md:flex-row md:gap-5'>
                            <div>
                                {/* Name field*/}
                                <div>
                                    <input
                                        type="text"
                                        placeholder='Name'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("name", { required: "Name is required" })}
                                    />
                                </div>

                                {
                                    errors.name && (
                                        <p className="text-red-500 text-sm">{errors.name.message}</p>
                                    )
                                }

                                {/* Email field*/}



                                <div>
                                    <input
                                        type="email"
                                        placeholder='Email address'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("email", {
                                            required: "Email is required", pattern: {
                                                value: /^[A-z0-9._%+-]+@[A-z0-9.-]+.[A-z]{2,4}$/i,
                                                message: "Invalid email address"
                                            }
                                        })}
                                    />
                                </div>
                                {
                                    errors.email && (
                                        <p className="text-red-500 text-sm">{errors.email.message}</p>
                                    )
                                }

                                {/* Phone number field */}
                                <div>
                                    <input
                                        type="tel"
                                        placeholder='Phone Number'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("phone", {
                                            required: "Phone number is required",
                                            pattern: {
                                                value: /^[6-9][0-9]{9}$/,
                                                message: "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits"
                                            }
                                        })}
                                    />
                                </div>

                                {
                                    errors.phone && (
                                        <p className="text-red-500 text-sm">{errors.phone.message}</p>
                                    )
                                }


                                {/* Password field*/}

                                <div>
                                    <input
                                        type="password"
                                        placeholder='Password'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("password", {
                                            required: "Password is Mandatory", minLength: {
                                                value: 8, message: "Password must be of atleast 6 characters long"
                                            }
                                        })}
                                    />
                                </div>

                                {
                                    errors.password && (
                                        <p className="text-red-500 text-sm">{errors.password.message}</p>
                                    )
                                }

                                {/* specialization field*/}

                                <div>
                                    <input
                                        type="text"
                                        placeholder='Specialization'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("specialization", { required: "Specialization is required", minLength: { value: 4, message: "Specialization must be of length 4 characters long" } })}
                                    />


                                    {
                                        errors.specialization && (
                                            <p className="text-red-500 text-sm">{errors.specialization.message}</p>
                                        )
                                    }
                                </div>
                                <div>
                                    <textarea
                                        type=""
                                        placeholder='Bio'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("bio", { required: "Bio is required" })}
                                    />


                                    {
                                        errors.hospital && (
                                            <p className="text-red-500 text-sm">{errors.bio.message}</p>
                                        )
                                    }
                                </div>

                            </div>

                            <div>


                                <div>
                                    <input
                                        type="Number"
                                        placeholder='Experience'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("experience", { required: "Experience is required" })}
                                    />


                                    {
                                        errors.hospital && (
                                            <p className="text-red-500 text-sm">{errors.experience.message}</p>
                                        )
                                    }
                                </div>




                                <div>
                                    <input
                                        type="Number"
                                        placeholder='Fee'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("fee", { required: "fee is required" })}
                                    />


                                    {
                                        errors.hospital && (
                                            <p className="text-red-500 text-sm">{errors.fee.message}</p>
                                        )
                                    }
                                </div>

                                {/* hospital field*/}

                                <div className='relative'>
                                    <input
                                        type="text"
                                        placeholder='Hospital Name'
                                        className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                        {...register("hospitalName", { required: "hospital name is required", minLength: { value: 4, message: "Hospital name must be of length 4 characters long" } })}

                                        onChange={onHospitalInput}
                                    />


                                    {
                                        errors.hospital && (
                                            <p className="text-red-500 text-sm">{errors.hospitalName.message}</p>
                                        )
                                    }

                                    {/* Suggestion dropdown */}
                                    {matches.length > 0 && (
                                        <ul className="absolute  border w-full max-h-40 overflow-y-auto z-20 rounded-lg  bg-gray-100 bottom-full">
                                            {matches.map(h => (
                                                <li
                                                    key={h._id}
                                                    className="px-3 py-2 hover:bg-blue-200 cursor-pointer"
                                                    onClick={() => pickHospital(h)}

                                                >
                                                    {h.name}, {h.location}
                                                </li>

                                            ))}

                                        </ul>
                                    )}
                                </div>

                                {
                                    showExtras && (
                                        <div>
                                            <input
                                                type="tel"
                                                placeholder='Hospital Phone Number'
                                                className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                                {...register("hospitalPhoneNumber", {
                                                    required: "Hospital Phone number is required",
                                                    pattern: {
                                                        value: /^[6-9][0-9]{9}$/,
                                                        message: "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits"
                                                    }
                                                })}
                                            />
                                            {
                                                errors.phone && (
                                                    <p className="text-red-500 text-sm">{errors.hospitalPhoneNumber.message}</p>
                                                )
                                            }
                                        </div>


                                    )
                                }

                                {
                                    showExtras && (<div>
                                        <input type="text"
                                            placeholder='Hospital Location'
                                            className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                            {
                                            ...register('location', {
                                                required: "Hospital Location is required",
                                                pattern: {
                                                    minLength: { value: 4, message: "Hospital Location must be of length 3 characters long" }
                                                }
                                            })
                                            }
                                        />
                                        {
                                            errors.location && (
                                                <p className="text-red-500 text-sm">{errors.location.message}</p>
                                            )
                                        }
                                    </div>)
                                }

                                {
                                    showExtras && (<div>
                                        <input type="text"
                                            placeholder='Google Maps Link'
                                            className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500'
                                            {
                                            ...register('googleMapsLink', {
                                                required: "Google Maps Link is required",
                                                pattern: {
                                                    minLength: { value: 10, message: "Google Maps Link must be of length 10 characters long" }
                                                }
                                            })
                                            }
                                        />
                                        {
                                            errors.googleMapsLink && (
                                                <p className="text-red-500 text-sm">{errors.googleMapsLink.message}</p>
                                            )
                                        }
                                    </div>)
                                }





                            </div>

                        </div>



                        <div disabled={isLoading}>
                            <button className='w-[300px] sm:w-[100px] px-3 py-2 border rounded-lg bg-green-500 text-white font-semibold mt-2 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500'
                            >
                                {isLoading ? "Loading..." : "Sign Up"}
                            </button>
                        </div>
                        <div className='mt-2'>
                            <p className='text-gray-600'>Already have an account?
                                <NavLink to="/signin" className="text-green-500 font-semibold"> Sign In</NavLink>
                            </p>

                        </div>

                    </form>
                </div>


            </div>
        </div>

    )
}


export default Signup
