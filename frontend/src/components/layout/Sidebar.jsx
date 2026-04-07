import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Home, ShoppingBag, List, Users, Briefcase, Settings, LogOut, User, FileText, ClipboardList } from 'lucide-react';

const Sidebar = () => {
    const { userInfo, logout } = useAuthStore();
    const location = useLocation();

    const getLinks = () => {
        if (userInfo?.role === 'admin') {
            return [
                { name: 'Overview', path: '/dashboard', icon: Home },
                { name: 'Users', path: '/dashboard/users', icon: Users },
                { name: 'Requests', path: '/dashboard/requests', icon: ClipboardList },
                { name: 'Artisans', path: '/dashboard/artisans', icon: Briefcase },
                { name: 'Products', path: '/dashboard/products', icon: ShoppingBag },
                { name: 'Orders', path: '/dashboard/orders', icon: List },
                { name: 'Craft stories', path: '/dashboard/content', icon: Settings },
            ];
        } else if (userInfo?.role === 'artisan') {
            return [
                { name: 'Dashboard', path: '/dashboard', icon: Home },
                { name: 'My Products', path: '/dashboard/products', icon: ShoppingBag },
                { name: 'Orders', path: '/dashboard/orders', icon: List },
                { name: 'QR Code', path: '/dashboard/qrcode', icon: Settings },
                { name: 'My Profile', path: '/dashboard/artisan-profile', icon: User },
                { name: 'Craft stories', path: '/dashboard/craft-stories', icon: FileText },
            ];
        } else {
            return [
                { name: 'Catalog', path: '/dashboard/products', icon: ShoppingBag },
                { name: 'My Orders', path: '/dashboard/orders', icon: List },
                { name: 'Wishlist', path: '/dashboard/wishlist', icon: Home },
                { name: 'Craft stories', path: '/dashboard/craft-stories', icon: FileText },
            ];
        }
    };

    return (
        <div className="w-64 bg-white dark:bg-gray-900 shadow-lg h-screen flex flex-col justify-between hidden md:block transition-all duration-300 z-50 border-r border-gray-100 dark:border-gray-800">
            <div>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h1 className="text-2xl font-bold text-brand-600 dark:text-brand-400 tracking-tight">ArtisanMarket</h1>
                    {userInfo && (
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">{userInfo.role} Area</p>
                    )}
                </div>
                <nav className="p-4 space-y-2 mt-4">
                    {getLinks().map((link) => {
                        const Icon = link.icon;
                        const isActive =
                            location.pathname === link.path ||
                            (link.path === '/dashboard/products' && location.pathname.startsWith('/dashboard/products')) ||
                            (link.path === '/dashboard/craft-stories' &&
                                location.pathname.startsWith('/dashboard/craft-stories')) ||
                            (link.path === '/dashboard/content' && location.pathname.startsWith('/dashboard/content'));
                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-semibold'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                <Icon size={20} className={isActive ? 'text-brand-500' : 'text-gray-400'} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
