import { Search, User, ShoppingCart, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import useWishlistStore from '../../store/useWishlistStore';
import { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';

const DEBOUNCE_MS = 350;

const Topbar = () => {
    const { userInfo } = useAuthStore();
    const { cartItems } = useCartStore();
    const { wishlistItems } = useWishlistStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [q, setQ] = useState('');
    const debounceRef = useRef(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setQ(params.get('keyword') || params.get('q') || '');
    }, [location.search]);

    const isCustomerArea = userInfo?.role === 'customer' || userInfo?.role === undefined;

    const applySearchToUrl = (raw) => {
        if (!isCustomerArea) return;
        const term = raw.trim();
        const current = new URLSearchParams(location.search);
        const category = current.get('category');

        const next = new URLSearchParams();
        if (term) next.set('keyword', term);
        if (category) next.set('category', category);

        navigate(next.toString() ? `/dashboard/products?${next.toString()}` : '/dashboard/products', { replace: true });
    };

    const onSearchChange = (e) => {
        const v = e.target.value;
        setQ(v);
        if (!isCustomerArea) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => applySearchToUrl(v), DEBOUNCE_MS);
    };

    const onSearchSubmit = (e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        applySearchToUrl(q);
    };

    return (
        <div className="h-20 bg-white dark:bg-gray-900 shadow-sm flex items-center justify-between px-8 border-b border-gray-100 dark:border-gray-800 relative z-40">
            <div className="flex-1 max-w-lg hidden sm:block">
                {userInfo?.role !== 'artisan' && userInfo?.role !== 'admin' && (
                    <form onSubmit={onSearchSubmit} className="relative">
                        <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 p-0 border-0 bg-transparent cursor-pointer" aria-label="Search">
                            <Search size={20} />
                        </button>
                        <input
                            type="search"
                            value={q}
                            onChange={onSearchChange}
                            placeholder="Search name, category, or artisan — filters as you type…"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-transparent rounded-xl focus:border-brand-300 focus:ring-2 focus:ring-brand-100 focus:bg-white dark:focus:bg-gray-800 transition-all text-sm outline-none placeholder:text-gray-400"
                        />
                    </form>
                )}
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <ThemeToggle />
                {userInfo?.role !== 'admin' && userInfo?.role !== 'artisan' && (
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => navigate('/dashboard/wishlist')} className="relative p-2 text-gray-500 hover:text-red-500 transition-colors group">
                            <Heart size={22} className={wishlistItems.length > 0 ? 'fill-red-500 text-red-500' : ''} />
                            {wishlistItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white px-1 shadow-sm">
                                    {wishlistItems.length}
                                </span>
                            )}
                        </button>

                        <button type="button" onClick={() => navigate('/dashboard/cart')} className="relative p-2 text-gray-500 hover:text-brand-600 transition-colors group">
                            <ShoppingCart size={22} />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-brand-600 text-white text-[10px] font-bold rounded-full border-2 border-white px-1 shadow-sm">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3 cursor-pointer pl-4 border-l border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
                        {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{userInfo?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-400 capitalize">{userInfo?.role || 'User'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
