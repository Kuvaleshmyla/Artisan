import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Clock, Truck, CheckCircle2, ChevronDown, ChevronUp, MapPin, RefreshCw } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import OrderTrackingBar from '../../components/orders/OrderTrackingBar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [expandedIds, setExpandedIds] = useState([]);
    const [feedbackInput, setFeedbackInput] = useState({});
    const [issueInput, setIssueInput] = useState({});
    const [loading, setLoading] = useState(false);

    const { userInfo } = useAuthStore();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const endpoint = userInfo?.role === 'admin' ? `${API_BASE_URL}/api/orders/all` :
                             userInfo?.role === 'artisan' ? `${API_BASE_URL}/api/orders/artisanorders` : `${API_BASE_URL}/api/orders/myorders`;
            const { data } = await axios.get(endpoint, { withCredentials: true });
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo) fetchOrders();
        // Auto-refresh orders every 30 seconds for real-time updates
        const interval = setInterval(() => {
            if (userInfo) fetchOrders();
        }, 30000);
        return () => clearInterval(interval);
    }, [userInfo]);

    const handleFeedbackSubmit = async (orderId) => {
        if (!feedbackInput[orderId]) return;
        try {
            await axios.post(`${API_BASE_URL}/api/orders/${orderId}/feedback`, { feedback: feedbackInput[orderId] }, { withCredentials: true });
            setFeedbackInput(prev => ({...prev, [orderId]: ''}));
            fetchOrders();
        } catch (e) {
            console.error('Failed to submit feedback', e);
        }
    };

    const handleIssueSubmit = async (orderId) => {
        if (!issueInput[orderId]) return;
        try {
            await axios.post(`${API_BASE_URL}/api/orders/${orderId}/issue`, { issue: issueInput[orderId] }, { withCredentials: true });
            setIssueInput(prev => ({...prev, [orderId]: ''}));
            fetchOrders();
        } catch (e) {
            console.error('Failed to submit issue', e);
        }
    };

    const toggleExpand = (id) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]);
    };

    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'pending': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'accepted': return 'bg-teal-50 text-teal-800 border-teal-200';
            case 'processing': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'shipped': return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-orange-50 text-orange-600 border-orange-200';
        }
    };

    const getStatusIcon = (status) => {
        switch(status?.toLowerCase()) {
            case 'pending': return <Clock size={16} />;
            case 'accepted': return <CheckCircle2 size={16} />;
            case 'processing': return <Package size={16} />;
            case 'shipped': return <Truck size={16} />;
            case 'delivered': return <CheckCircle2 size={16} />;
            default: return <Clock size={16} />;
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    {userInfo?.role === 'admin' ? 'Global System Orders' : 
                     userInfo?.role === 'artisan' ? 'Artisan Order History' : 'Customer Order History'}
                </h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-brand-700 bg-brand-50 px-4 py-1.5 rounded-full border border-brand-200 shadow-sm leading-none">{orders.length} Active Orders</span>
                    <button 
                        onClick={fetchOrders}
                        disabled={loading}
                        className="p-2 text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all disabled:opacity-50"
                        title="Refresh orders"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-600 text-xs uppercase tracking-widest font-semibold">
                                <th className="p-5 pl-6">Navigation / Order ID</th>
                                <th className="p-5">Order Date</th>
                                <th className="p-5">Order Total</th>
                                <th className="p-5">Current Status</th>
                                <th className="p-5 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <div className="w-24 h-24 bg-gray-50 rounded-full flex flex-col items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                                            <Package className="text-gray-300" size={36} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">No active order history</h3>
                                        <p className="text-gray-500 font-medium">Head back to the catalog to discover handcrafted products.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => {
                                    const shortId = `ORD-${order._id.substring(order._id.length - 8).toUpperCase()}`;
                                    const isExpanded = expandedIds.includes(order._id);
                                    
                                    return (
                                        <React.Fragment key={order._id}>
                                            <tr className="hover:bg-brand-50/40 transition-colors group cursor-pointer" onClick={() => toggleExpand(order._id)}>
                                                <td className="p-5 pl-6">
                                                    <span className="font-mono font-bold text-brand-600 group-hover:text-brand-800 transition-colors flex items-center gap-2">
                                                        {shortId} {isExpanded ? <ChevronUp size={16} className="text-brand-400" /> : <ChevronDown size={16} className="text-brand-400" />}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-gray-700 font-semibold tracking-wide">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="p-5 font-black text-gray-900 text-lg">
                                                    ₹{order.totalAmount}
                                                </td>
                                                <td className="p-5">
                                                    <span className={`inline-flex items-center gap-2 border px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(order.status || 'pending')}`}>
                                                        {getStatusIcon(order.status || 'pending')} {order.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right pr-6">
                                                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(order._id); }} className="text-brand-600 font-bold px-5 py-2.5 border border-brand-200 rounded-lg hover:bg-brand-600 hover:text-white transition-all shadow-sm">
                                                        {isExpanded ? 'Hide Details' : 'Track Package'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan="5" className="p-6">
                                                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                            {/* Status Progress */}
                                                            <div className="mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                                                                <OrderTrackingBar status={order.status} />
                                                            </div>
                                                            
                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                                                <p className="text-sm text-gray-600">
                                                                    Payment: <span className="font-bold uppercase">{order.paymentStatus || 'pending'}</span>
                                                                </p>
                                                                <Link
                                                                    to={`/dashboard/orders/${order._id}`}
                                                                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
                                                                >
                                                                    View full order
                                                                </Link>
                                                            </div>

                                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-6">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Unique Navigation Route Core</p>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-mono text-xl font-black bg-brand-50 text-brand-700 px-4 py-1.5 rounded-lg border border-brand-200 select-all tracking-wider">{order._id}</span>
                                                                        <span className="text-xs text-brand-600 font-medium tracking-wide">← Global Database Tracking ID</span>
                                                                    </div>
                                                                </div>
                                                                <div className="md:text-right">
                                                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Package Destination Point</p>
                                                                    <div className="flex items-start md:justify-end gap-2 text-gray-700 font-medium">
                                                                        <MapPin size={18} className="mt-0.5 text-brand-500" />
                                                                        {order.shippingAddress ? (
                                                                            <p className="max-w-xs">{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip} <br/><span className="text-sm text-gray-400 mt-1 block">Shipment Country: {order.shippingAddress.country}</span></p>
                                                                        ) : <p>External API Integration Sync Error</p>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
                                                                    <p className="font-bold text-gray-800 text-lg">Purchased Artisan Items</p>
                                                                    <p className="text-sm font-bold text-gray-400">{order.items?.length || 0} ITEMS</p>
                                                                </div>
                                                                <div className="space-y-4 max-w-3xl">
                                                                    {order.items && order.items.map((item, index) => (
                                                                        <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm hover:border-brand-200 transition-colors">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center font-bold text-gray-300 border border-gray-100 shadow-inner">
                                                                                    <span className="text-[10px] leading-tight">ITEM</span>
                                                                                    <span>{index + 1}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-bold text-gray-800 text-lg leading-tight mb-1">{item.name}</p>
                                                                                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded w-fit">
                                                                                        Vendor: {item.artisanId?.businessName || item.artisanId?.name || 'Artisan'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-10">
                                                                                <div className="text-center">
                                                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Quantity</p>
                                                                                    <p className="text-gray-700 font-bold bg-white px-3 py-1 rounded border border-gray-200 shadow-sm">{item.quantity}</p>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Subtotal</p>
                                                                                    <p className="font-black text-gray-900 text-xl tracking-tight">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Feedback & Issues Section */}
                                                            <div className="mt-8 pt-6 border-t border-gray-100">
                                                                <div className="flex justify-between items-center mb-6">
                                                                    <p className="font-bold text-gray-800 text-lg">Feedback & Issues</p>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {/* Feedback Block */}
                                                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                                                        <h4 className="font-semibold text-gray-800 mb-3">Customer Feedback</h4>
                                                                        {order.feedback ? (
                                                                            <p className="text-gray-600 text-sm italic">"{order.feedback}"</p>
                                                                        ) : (
                                                                            userInfo?.role !== 'artisan' && order.status === 'delivered' ? (
                                                                                <div className="flex flex-col gap-3">
                                                                                    <textarea 
                                                                                        className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-300" 
                                                                                        placeholder="How was your product? Rate your experience..."
                                                                                        value={feedbackInput[order._id] || ''}
                                                                                        onChange={(e) => setFeedbackInput({...feedbackInput, [order._id]: e.target.value})}
                                                                                    ></textarea>
                                                                                    <button 
                                                                                        className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 w-fit transition-colors shadow-sm"
                                                                                        onClick={() => handleFeedbackSubmit(order._id)}
                                                                                    >
                                                                                        Submit Feedback
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-sm text-gray-400">No feedback provided yet.</p>
                                                                            )
                                                                        )}
                                                                    </div>

                                                                    {/* Issue Block */}
                                                                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                                                        <h4 className="font-semibold text-red-800 mb-3">Reported Issues</h4>
                                                                        {order.issue ? (
                                                                            <p className="text-red-700 text-sm"><span className="font-bold border-b border-red-300 pb-0.5">Issue:</span> {order.issue}</p>
                                                                        ) : (
                                                                            userInfo?.role !== 'artisan' && (order.status === 'delivered' || order.status === 'shipped') ? (
                                                                                <div className="flex flex-col gap-3">
                                                                                    <textarea 
                                                                                        className="w-full text-sm p-3 border border-red-200 rounded-lg focus:outline-none focus:border-red-300 bg-white" 
                                                                                        placeholder="Describe any issue with the delivery or product..."
                                                                                        value={issueInput[order._id] || ''}
                                                                                        onChange={(e) => setIssueInput({...issueInput, [order._id]: e.target.value})}
                                                                                    ></textarea>
                                                                                    <button 
                                                                                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 w-fit transition-colors shadow-sm"
                                                                                        onClick={() => handleIssueSubmit(order._id)}
                                                                                    >
                                                                                        Submit Issue
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-sm text-red-400">No issues reported.</p>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default MyOrders;
