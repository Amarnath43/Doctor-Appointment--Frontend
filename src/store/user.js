import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { USER_STORE_PERSIST } from "../const/user";

const userStore = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  reset: () => {
    set({ user: null });
    // clear persisted storage entry
    try {
      localStorage.removeItem(USER_STORE_PERSIST);
      sessionStorage.removeItem(USER_STORE_PERSIST);
    } catch {}
  },
});

const useUserStore = create(
  devtools(
    persist(userStore, {
      name: USER_STORE_PERSIST,
    })
  )
);

export default useUserStore;
