import axios from 'axios';
import { BASE_URL } from '../const/env.const'
import toast from 'react-hot-toast'
import { getToken, removeToken } from '../../../../../DoctorSync/frontend/vite-project/src/helper';
import { USER_STORE_PERSIST } from '../const/user';

const AxiosInstances = axios.create({
    baseURL: BASE_URL
})

AxiosInstances.interceptors.request.use((config) => {
    const token = getToken();
    token && (config.headers.Authorization = `Bearer ${token}`)
    return config;
})

AxiosInstances.interceptors.response.use(
    (response) => response,
    (error) => {
        //const field = error?.response?.data?.field;
        const message = error?.response?.data?.message || error?.message || "Something went wrong";
        toast.error(message)
        
            if (error.response.status == '401') {
                removeToken()
                sessionStorage.removeItem(USER_STORE_PERSIST);
                
            }
        
        
        throw error;
    }
)

export default AxiosInstances;