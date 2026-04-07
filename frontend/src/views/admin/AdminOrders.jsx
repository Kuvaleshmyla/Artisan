import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Package, User, Mail, Eye } from 'lucide-react';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        fetchAllOrders();
    }, []);

    const fetchAllOrders = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/orders/all', { withCredentials: true });
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const sortedOrders = useMemo(() => {
        const list = [...orders];
        list.sort((a, b) => {
            const ta = new Date(a.createdAt || 0).getTime();
            const tb = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? tb - ta : ta - tb;
        });
        return list;
    }, [orders, sortOrder]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const { data } = await axios.put(
                `/api/orders/${orderId}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            setOrders(orders.map(order => order._id === orderId ? data.order : order));
            alert('Order status updated successfully');
        } catch (error) {
            console.error('Error updating order status:', error);
            alert(error.response?.data?.message || 'Failed to update order status');
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            accepted: 'bg-teal-50 text-teal-800 border-teal-200',
            processing: 'bg-blue-50 text-blue-700 border-blue-200',
            shipped: 'bg-purple-50 text-purple-700 border-purple-200',
            delivered: 'bg-green-50 text-green-700 border-green-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200'
        };
        return statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    /** Only fulfillment steps after artisan acceptance; artisan sets “accepted” via verify-payment. */
    const getAdminActions = (current) => {
        const actions = [];
        if (current === 'accepted') actions.push({ status: 'processing', label: 'Mark processing' });
        if (current === 'processing') actions.push({ status: 'shipped', label: 'Mark shipped' });
        if (current === 'shipped') actions.push({ status: 'delivered', label: 'Mark delivered' });
        if (current !== 'delivered' && current !== 'cancelled') {
            actions.push({ status: 'cancelled', label: 'Cancel order', danger: true });
        }
        return actions;
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading orders...</p></div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-2xl font-bold text-gray-800">Order Management Hub</h1>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium whitespace-nowrap">Sort by date</span>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </label>
                    <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                        <p className="text-blue-700 font-semibold text-sm">{orders.length} Total Orders</p>
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No orders in the system yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left min-w-max">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs tracking-wider font-semibold">
                            <tr>
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Items</th>
                                <th className="p-4">Total Amount</th>
                                <th className="p-4">Current Status</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedOrders.map(order => (
                                <React.Fragment key={order._id}>
                                    <tr className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}>
                                        <td className="p-4 font-bold text-gray-800 text-sm">
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">{order._id.substring(0, 10)}...</code>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-brand-100 text-brand-600 rounded flex items-center justify-center text-sm font-bold">
                                                    {order.customerId?.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{order.customerId?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> {order.customerId?.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-bold">{order.items.length} Item{order.items.length !== 1 ? 's' : ''}</span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">₹{order.totalAmount.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4" onClick={(e) => e.stopPropagation()} title="Current payment status">
                                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                                                order.paymentStatus === 'paid' 
                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {order.paymentStatus || 'pending'}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-1">Open row for details</p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="inline-flex items-center justify-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                    
                                    {expandedOrderId === order._id && (
                                        <tr className="bg-slate-50 border-b border-gray-200">
                                            <td colSpan="7" className="p-6">
                                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Items</h4>
                                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                {order.items.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                                                        <span className="text-gray-700 font-medium">{item.name}</span>
                                                                        <div className="text-right">
                                                                            <p className="font-bold text-gray-800">₹{item.price} x {item.quantity}</p>
                                                                            <p className="text-xs text-gray-500">Artisan: {item.artisanId?.name || 'Unknown'}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Shipping Address</h4>
                                                            <div className="text-sm space-y-1 text-gray-700">
                                                                <p className="font-semibold">{order.shippingAddress.street}</p>
                                                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                                                                <p>{order.shippingAddress.country}</p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Info</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <p><span className="font-semibold text-gray-700">Method:</span> <span className="text-gray-600">{order.paymentMethod}</span></p>
                                                                <p><span className="font-semibold text-gray-700">Date:</span> <span className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</span></p>
                                                                {order.feedback && <p><span className="font-semibold text-gray-700">Feedback:</span> <span className="text-green-600">{order.feedback}</span></p>}
                                                                {order.issue && <p><span className="font-semibold text-gray-700">Issue:</span> <span className="text-red-600">{order.issue}</span></p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment</h4>
                                                        <p className="text-sm text-gray-800 mb-3">
                                                            Status: <strong className="uppercase">{order.paymentStatus || 'pending'}</strong>
                                                            {order.paymentMethod ? ` · Method: ${order.paymentMethod}` : ''}
                                                        </p>
                                                        {order.paymentScreenshot ? (
                                                            <a href={order.paymentScreenshot} target="_blank" rel="noreferrer" className="inline-block">
                                                                <img src={order.paymentScreenshot} alt="Payment proof" className="max-h-48 rounded-lg border border-gray-200" />
                                                            </a>
                                                        ) : (
                                                            <p className="text-xs text-gray-400">No payment screenshot uploaded.</p>
                                                        )}
                                                    </div>

                                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin — fulfillment</h4>
                                                        <p className="text-xs text-gray-500 mb-4">
                                                            Artisan verifies payment (status becomes <strong>accepted</strong>). You then move the order through processing → shipped → delivered.
                                                        </p>
                                                        {order.status === 'pending' && (
                                                            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                                                Awaiting artisan review of the payment screenshot. You can cancel if needed.
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-2">
                                                            {getAdminActions(order.status).map(({ status, label, danger }) => (
                                                                <button
                                                                    key={status + label}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (danger && !window.confirm('Cancel this order?')) return;
                                                                        handleStatusChange(order._id, status);
                                                                    }}
                                                                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide border ${
                                                                        danger
                                                                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-600 hover:text-white'
                                                                            : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                                                                    }`}
                                                                >
                                                                    {label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {getAdminActions(order.status).length === 0 && order.status !== 'pending' && (
                                                            <p className="text-sm text-gray-500">No further admin actions for this state.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
