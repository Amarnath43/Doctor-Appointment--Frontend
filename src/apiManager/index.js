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
    // ----- 1) Swallow canceled requests -----
    const isCanceled =
      axios.isCancel?.(error) ||
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError" ||
      String(error?.message || "").toLowerCase() === "canceled" ||
      error?.__CANCEL__ === true;

    if (isCanceled) {
      // Don’t toast, don’t redirect; just resolve with a no-op response
      return Promise.resolve({ __CANCEL__: true });
    }

    const status = error?.response?.status;
    const message =
      error?.response?.data?.message || error?.message || "Something went wrong";

    // ----- 2) Offline hint (only when there’s no response) -----
    if (!status) {
      // true network error (timeout/offline/CORS)
      if (!navigator.onLine) {
        // Friendlier toast when offline
        toast.error("You appear to be offline. Please check your connection.");
      } else {
        toast.error("Network error. Please check your connection.");
      }
      return Promise.reject(error);
    }

    // ----- 3) Normal HTTP errors -----
    if (status === 401) {
      // Avoid duplicate toasts for 401
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
    } else if (status === 403) {
      toast.error("You don’t have permission to perform this action.");
    } else {
      // Generic server-provided message
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default AxiosInstances;
