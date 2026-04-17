import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ShoppingBag, AlertOctagon, Package } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ usersCount: 0, artisansCount: 0, flagsCount: 0 });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, productsData, ordersData] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/artisans/admin/stats`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/products`),
                axios.get(`${API_BASE_URL}/api/orders/all`, { withCredentials: true })
            ]);

            setStats(statsData.data);
            setProducts(productsData.data);
            setOrders(ordersData.data);
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const issueCount = orders.filter((o) => o.issue && String(o.issue).trim()).length;

    if (loading) {
        return <div className="py-12 text-center text-gray-500">Loading dashboard…</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Super Admin System Control Panel</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/users')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 text-left hover:border-brand-300 hover:shadow-md transition-all"
                >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-gray-500 font-medium tracking-wide text-xs">CUSTOMERS</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.usersCount}</p>
                        <p className="text-xs text-brand-600 mt-1 font-semibold">Open panel →</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/dashboard/artisans')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 text-left hover:border-brand-300 hover:shadow-md transition-all"
                >
                    <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h3 className="text-gray-500 font-medium tracking-wide text-xs">ARTISANS</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.artisansCount}</p>
                        <p className="text-xs text-brand-600 mt-1 font-semibold">Open panel →</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/dashboard/products')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 text-left hover:border-brand-300 hover:shadow-md transition-all"
                >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h3 className="text-gray-500 font-medium tracking-wide text-xs">PRODUCTS</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{products.length}</p>
                        <p className="text-xs text-brand-600 mt-1 font-semibold">Open panel →</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/dashboard/issues')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-red-100 border-l-4 border-l-red-500 flex items-center gap-4 text-left hover:border-red-300 hover:shadow-md transition-all"
                >
                    <div className="p-3 bg-red-50 text-red-500 rounded-lg">
                        <AlertOctagon size={24} />
                    </div>
                    <div>
                        <h3 className="text-gray-500 font-medium tracking-wide text-xs">REPORTED ISSUES</h3>
                        <p className="text-2xl font-bold text-red-500 mt-1">{issueCount || stats.flagsCount}</p>
                        <p className="text-xs text-brand-600 mt-1 font-semibold">Open panel →</p>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    type="button"
                    onClick={() => navigate('/dashboard/orders')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm text-left hover:shadow-md transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-blue-900 mb-2">Orders</h3>
                            <p className="text-3xl font-bold text-blue-700">{orders.length}</p>
                            <p className="text-sm text-blue-600 mt-2">Manage payment & fulfillment →</p>
                        </div>
                        <Package className="text-blue-300" size={40} />
                    </div>
                </button>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
                    <h3 className="text-lg font-bold text-green-900 mb-2">Total revenue</h3>
                    <p className="text-3xl font-bold text-green-700">
                        ₹{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 mt-2">From all orders</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
