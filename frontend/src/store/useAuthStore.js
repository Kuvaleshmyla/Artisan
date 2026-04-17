import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const useAuthStore = create(
    persist(
        (set) => ({
            userInfo: null,
            login: async (email, password) => {
                const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password }, { withCredentials: true });
                set({ userInfo: data });
                return data;
            },
            register: async (userData) => {
                const config = { withCredentials: true };
                const { data } =
                    userData instanceof FormData
                        ? await axios.post(`${API_BASE_URL}/api/auth/register`, userData, config)
                        : await axios.post(`${API_BASE_URL}/api/auth/register`, userData, config);
                set({ userInfo: data });
                return data;
            },
            logout: async () => {
                await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
                set({ userInfo: null });
            },
        }),
        {
            name: 'auth-storage', // persists session UI state across browser refreshes
        }
    )
);

export default useAuthStore;
