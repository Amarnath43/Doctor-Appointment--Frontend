import React from 'react'
import { NavLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import AxiosInstances from '../apiManager';
import { setToken } from '../helper/index'
import useUserStore from '../store/user'

const signin = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError]=useState({})
  const navigate=useNavigate();
  const {user,setUser,clearUser}=useUserStore();
  const onSubmit=async(data)=>{
    setIsLoading(true);
    console.log(data);
    try
    {
      const response=await AxiosInstances.post('/user/signin',data);
      console.log(response);
      setToken(response?.data?.token);
      setUser(response?.data?.user)

      //Check for a pending booking
      const pending = JSON.parse(
        sessionStorage.getItem('pendingBooking') || 'null'
      )
      sessionStorage.removeItem('pendingBooking');

      if (pending?.path) {
        // 3a) If they had a pending booking, send them back with state
        return navigate(pending.path, {
          replace: true,
          state: {
            selectedDate: pending.date,
            selectedSlot: pending.slot
          }
        })
      };
      navigate('/')

    }
    catch(e)
    {
      console.log(e);
      if(e.response && e.response.data)
      {
        const {field, message}=e.response.data;
        field==='email' ?setServerError({email:message}) :setServerError({password:message})
      }
    }
    finally
    {
      setIsLoading(false);
    }


  }

  
  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='bg-white w-full sm:w-[500px] text-center md:px-10 md:py-8  px-8 py-6 rounded-xl shadow-2xl'>
        <h1 className='font-bold text-3xl text-gray-800 mb-4'>Welcome Back</h1>
        <p className='text-gray-600 mb-6'>Sign in to access your account</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email field*/}
          <div>
            <input
              type="email"
              placeholder='Email address'
              className='w-full px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-4 focus:outline-none focus:ring-2 focus:ring-green-500'
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
          {
            serverError.email && (
              <p style={{ color: 'red' }}>{serverError.email}</p>
            )
          }

          {/* Password field*/}

          <div>
            <input
              type="password"
              placeholder='Password'
              className='w-full px-3 py-2 border bg-gray-100 rounded-lg placeholder-gray-500 mt-4 focus:outline-none focus:ring-2 focus:ring-green-500'
              {...register("password", {
                required: "Password is Mandatory", minLength: {
                  value: 8, message: "Password must be of atleast 6 characters long"
                }
              })}
            />
          </div>
          {
            errors.password && (
              <p style={{ color: 'red' }}>{errors.password.message}</p>
            )
          }
          {
            serverError.password && (
              <p style={{ color: 'red' }}>{serverError.password}</p>
            )
          }


<div disabled={isLoading}>
                                <button className=' h-10 px-4 text-white border-green-500 bg-green-500 font-bold rounded-lg w-full mt-4 mb-2'>{isLoading ? "Loading..." : "Sign In"
                                }</button>
                            </div>
          <div className='mt-4'>
            <p className='text-gray-600'>Don’t have an account yet?
              <NavLink to="/user/register" className="text-green-500 font-semibold"> Sign Up</NavLink>
            </p>
            <p className='text-gray-600 mt-2'>Register as
              <NavLink to="/doctor/register" className="text-green-500 font-semibold"> Doctor</NavLink>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default signin
