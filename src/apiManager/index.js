import axios from "axios";
import { BASE_URL } from "../const/env.const";
import toast from "react-hot-toast";
import { getToken, removeToken } from "../helper/index";
import { USER_STORE_PERSIST } from "../const/user";
import useUserStore from "../store/user";

const AxiosInstances = axios.create({
  baseURL: BASE_URL,
});

// ====== REQUEST ======
AxiosInstances.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ====== RESPONSE ======
let isRedirecting = false;

AxiosInstances.interceptors.response.use(
  (response) => response,
  (error) => {
    const isCanceled =
      axios.isCancel?.(error) ||
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError" ||
      String(error?.message || "").toLowerCase() === "canceled" ||
      error?.__CANCEL__ === true;

    if (isCanceled) {
      return Promise.resolve({ __CANCEL__: true });
    }

    const status = error?.response?.status;

    // offline / no-response
    if (!status) {
      if (!navigator.onLine) {
        toast.error("You appear to be offline. Please check your connection.");
      } else {
        toast.error("Network error. Please check your connection.");
      }
      error._silenced = true;         // <-- mark as already handled
      return Promise.reject(error);
    }

    if (status === 401) {
      // clear + redirect; no toast here
      if (!isRedirecting) {
        isRedirecting = true;
        try {
          removeToken();
          useUserStore.getState().reset();
          sessionStorage.removeItem(USER_STORE_PERSIST);
        } finally {
          const path = window.location.pathname + window.location.search;
          const signinUrl =
            window.location.pathname === "/signin"
              ? "/signin"
              : `/signin?next=${encodeURIComponent(path)}`;
          window.location.assign(signinUrl);
        }
      }
      error._silenced = true;        
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error("You don’t have permission to perform this action.");
      error._silenced = true;         
      return Promise.reject(error);
    }

    // let pages handle everything else
    return Promise.reject(error);
  }
);


export default AxiosInstances;
