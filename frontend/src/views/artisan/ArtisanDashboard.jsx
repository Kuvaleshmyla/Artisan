import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Zap, TrendingUp } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ArtisanDashboard = () => {
    const { userInfo } = useAuthStore();
    const [stats, setStats] = useState({ earnings: 0, pendingOrders: 0, totalProducts: 0, completedOrders: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!userInfo?._id) return;
            try {
                setLoading(true);
                const [{ data: orders }, { data: products }] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/orders/artisanorders`, { withCredentials: true }),
                    axios.get(`${API_BASE_URL}/api/products/artisan/mine`, { withCredentials: true }),
                ]);

                const mine = Array.isArray(products) ? products : [];

                let totalEarnings = 0;
                let pendingCount = 0;
                let completedCount = 0;

                orders.forEach((order) => {
                    if (order.status === 'pending') pendingCount++;
                    if (order.status === 'delivered') completedCount++;
                    if (order.status === 'delivered') {
                        order.items.forEach((item) => {
                            const aid = item.artisanId?._id || item.artisanId;
                            if (aid && aid.toString() === userInfo._id.toString()) {
                                totalEarnings += item.price * item.quantity;
                            }
                        });
                    }
                });

                setStats({
                    earnings: totalEarnings,
                    pendingOrders: pendingCount,
                    totalProducts: mine.length,
                    completedOrders: completedCount
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [userInfo]);

    if (loading) {
        return <div className="py-12 text-center text-gray-500">Loading…</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-800">Shop overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={24}/></div>
                    <div>
                        <h3 className="text-gray-500 font-medium tracking-wide text-xs">RECOGNIZED EARNINGS</h3>
                        <p className="text-2xl font-bold text-green-600 mt-1">₹{stats.earnings.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Zap size={24}/></div>
                    <div>
                        <h3 className="text-gray-500 font-medium tracking-wide text-xs">PENDING ORDERS</h3>
                        <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingOrders}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24}/></div>
                    <div>
                        <h3 className="text-gray-500 font-medium tracking-wide text-xs">COMPLETED ORDERS</h3>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{stats.completedOrders}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Package size={24}/></div>
                    <div>
                        <h3 className="text-gray-500 font-medium tracking-wide text-xs">YOUR PRODUCTS</h3>
                        <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalProducts}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-brand-50 to-brand-100 p-12 rounded-xl shadow-sm border border-brand-200 mt-8 text-center">
                <div className="text-6xl mb-4 opacity-80">📈</div>
                <h3 className="text-xl font-semibold text-brand-900 mb-2">Orders & payments</h3>
                <p className="text-brand-700 font-medium mb-4">Review customer payment screenshots and confirm orders from your order list.</p>
                <Link to="/dashboard/orders" className="inline-block bg-brand-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-sm">View orders</Link>
            </div>
        </div>
    );
};

export default ArtisanDashboard;
