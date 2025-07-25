import React from 'react'
import { NavLink } from 'react-router-dom'
import { useForm } from "react-hook-form"
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstances from '../apiManager';

const Signup = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm()

    const onSubmit = async (data) => {
        setIsLoading(true);
        console.log("data", data)
        try {
            const response = await AxiosInstances.post('/user/register', data);
            console.log(response);
            reset()
            navigate('/signin')
        }
        catch (e) {
            console.log(e);

        }
        finally {
            setIsLoading(false)
        }

    };

    return (
        <div className='flex justify-center items-center h-screen '>
            <div className='bg-white w-full  text-center px-6 py-8 rounded-xl '>
                <h1 className='font-bold text-3xl text-gray-800 mb-4'>
                    Register as User
                </h1>
                <p className='text-gray-600 mb-6'>Sign in to access your account</p>

                <form onSubmit={handleSubmit(onSubmit)}>

                    <div>
                        {/* Name field*/}
                        <div>
                            <input
                                type="text"
                                placeholder='Name'
                                className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-4 focus:outline-none focus:ring-2 focus:ring-green-500'
                                {...register("name", { required: "Name is required" })}
                            />
                        </div>

                        {
                            errors.name && (
                                <p style={{ color: 'red' }}>{errors.name.message}</p>
                            )
                        }

                        {/* Email field*/}



                        <div>
                            <input
                                type="email"
                                placeholder='Email address'
                                className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-4 focus:outline-none focus:ring-2 focus:ring-green-500'
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
                                <p style={{ color: 'red' }}>{errors.email.message}</p>
                            )
                        }

                        {/* Phone number field */}
                        <div>
                            <input
                                type="tel"
                                placeholder='Phone Number'
                                className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-4 focus:outline-none focus:ring-2 focus:ring-green-500'
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
                                <p style={{ color: 'red' }}>{errors.phone.message}</p>
                            )
                        }


                        {/* Password field*/}

                        <div>
                            <input
                                type="password"
                                placeholder='Password'
                                className='w-[300px] px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-4 focus:outline-none focus:ring-2 focus:ring-green-500'
                                {...register("password", {
                                    required: "Password is Mandatory", minLength: {
                                        value: 8, message: "Password must be of atleast 8 characters long"
                                    }
                                })}
                            />
                        </div>

                        {
                            errors.password && (
                                <p style={{ color: 'red' }}>{errors.password.message}</p>
                            )
                        }

                    </div>
                    <div disabled={isLoading}>
                        <button className='w-[300px] px-3 py-2 border rounded-lg bg-green-500 text-white font-semibold mt-6 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500'>
                            {isLoading ? "Loading..." : "Sign Up"}
                        </button>
                    </div>
                    <div className='mt-4'>
                        <p className='text-gray-600'>Already have an account?
                            <NavLink to="/signin" className="text-green-500 font-semibold"> Sign In</NavLink>
                        </p>

                    </div>

                </form>
            </div>

        </div>

    )
}


export default Signup
