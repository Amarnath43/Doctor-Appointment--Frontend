import {create} from 'zustand';
import {persist, devtools} from 'zustand/middleware';
import { USER_STORE_PERSIST } from '../const/user';

const userStore=(set)=>({
    user:null,
    setUser:(user)=>{
        set({user:user})
    },
    clearUser:()=>{
        set({user:null})
    }
});

const useUserStore=create(
    devtools(
        persist(
            userStore, {
                name: USER_STORE_PERSIST
            }
        )
    )
)

export default useUserStore;