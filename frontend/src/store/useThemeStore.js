import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyDarkClass = (dark) => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', Boolean(dark));
};

const useThemeStore = create(
    persist(
        (set, get) => ({
            dark: false,
            toggle: () => {
                const next = !get().dark;
                applyDarkClass(next);
                set({ dark: next });
            },
            setDark: (dark) => {
                applyDarkClass(dark);
                set({ dark: Boolean(dark) });
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state) applyDarkClass(state.dark);
            },
        }
    )
);

export default useThemeStore;
