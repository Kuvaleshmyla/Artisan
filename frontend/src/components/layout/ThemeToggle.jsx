import { Moon, Sun } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

const ThemeToggle = ({ className = '' }) => {
    const { dark, toggle } = useThemeStore();

    return (
        <button
            type="button"
            onClick={toggle}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${className}`}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
        </button>
    );
};

export default ThemeToggle;
