import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
    persist(
        (set) => ({
            userInfo: null,
            login: async (email, password) => {
                const { data } = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
                set({ userInfo: data });
                return data;
            },
            register: async (userData) => {
                const config = { withCredentials: true };
                const { data } =
                    userData instanceof FormData
                        ? await axios.post('/api/auth/register', userData, config)
                        : await axios.post('/api/auth/register', userData, config);
                set({ userInfo: data });
                return data;
            },
            logout: async () => {
                await axios.post('/api/auth/logout', {}, { withCredentials: true });
                set({ userInfo: null });
            },
        }),
        {
            name: 'auth-storage', // persists session UI state across browser refreshes
        }
    )
);

export default useAuthStore;
