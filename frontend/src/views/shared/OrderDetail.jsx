import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, MapPin, ArrowLeft, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import OrderTrackingBar from '../../components/orders/OrderTrackingBar';

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

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const { data } = await axios.get(`/api/orders/${orderId}`, { withCredentials: true });
            setOrder(data);
        } catch (e) {
            console.error(e);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [orderId]);

    const verifyPayment = async () => {
        if (!window.confirm('Verify this payment screenshot and accept the order? The status will move to “accepted” for admin fulfillment.')) return;
        setSaving(true);
        try {
            const { data } = await axios.put(`/api/orders/${orderId}/verify-payment`, {}, { withCredentials: true });
            setOrder(data.order || data);
        } catch (e) {
            alert(e.response?.data?.message || 'Could not verify payment');
        } finally {
            setSaving(false);
        }
    };

    const adminUpdateStatus = async (status, danger) => {
        if (danger && !window.confirm('Cancel this order?')) return;
        setSaving(true);
        try {
            const { data } = await axios.put(`/api/orders/${orderId}/status`, { status }, { withCredentials: true });
            setOrder(data.order || data);
        } catch (e) {
            alert(e.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-brand-600" size={40} />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-600">Order not found or you do not have access.</p>
                <Link to="/dashboard/orders" className="text-brand-600 font-bold mt-4 inline-block">
                    Back to orders
                </Link>
            </div>
        );
    }

    const isArtisan = userInfo?.role === 'artisan';
    const isAdmin = userInfo?.role === 'admin';

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-600"
            >
                <ArrowLeft size={18} /> Back
            </button>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className="flex flex-wrap justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Order</p>
                        <p className="font-mono font-bold text-lg">{order._id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-2xl font-black text-gray-900">₹{Number(order.totalAmount).toFixed(2)}</p>
                    </div>
                </div>

                <div className="mb-8 rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-50/80 dark:bg-gray-900/40 p-5 sm:p-6">
                    <OrderTrackingBar status={order.status} />
                </div>

                <div className="mb-8">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Payment status</p>
                    <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-sm uppercase">
                        {order.paymentStatus}
                    </span>
                </div>

                {order.paymentScreenshot && (
                    <div className="mb-8">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Payment screenshot</p>
                        <p className="text-xs text-gray-500 mb-2">
                            {isAdmin ? 'Only the assigned artisan may verify this proof. Admins manage status after acceptance.' : null}
                        </p>
                        <a href={order.paymentScreenshot} target="_blank" rel="noreferrer" className="block">
                            <img
                                src={order.paymentScreenshot}
                                alt="Payment proof"
                                className="max-w-md rounded-xl border border-gray-200"
                            />
                        </a>
                    </div>
                )}

                {isArtisan && order.status === 'pending' && order.paymentScreenshot && order.paymentStatus !== 'paid' && (
                    <div className="mb-8">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={verifyPayment}
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
                        >
                            <CheckCircle2 size={20} />
                            {saving ? 'Saving…' : 'Verify payment & accept order'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Sets status to <strong>accepted</strong>. Platform admin will then move it to processing, shipped, and delivered.</p>
                    </div>
                )}

                {isAdmin && (
                    <div className="mb-8 border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-bold text-gray-800 mb-2">Admin — update fulfillment</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            After the artisan accepts (payment verified), use these actions. Order flow: accepted → processing → shipped → delivered.
                        </p>
                        {order.status === 'pending' && (
                            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                Waiting for the artisan to verify the payment screenshot.
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {getAdminActions(order.status).map(({ status, label, danger }) => (
                                <button
                                    key={status + label}
                                    type="button"
                                    disabled={saving}
                                    onClick={() => adminUpdateStatus(status, danger)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold ${
                                        danger
                                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                    } disabled:opacity-50`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                    <p className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin size={18} className="text-brand-500" /> Shipping
                    </p>
                    <p className="text-gray-700">
                        {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                        {order.shippingAddress?.zip}
                    </p>
                </div>

                <div className="mt-8">
                    <p className="font-semibold text-gray-800 mb-4">Items</p>
                    <ul className="space-y-3">
                        {order.items?.map((item, idx) => {
                            const vendor =
                                item.artisanId?.businessName || item.artisanId?.name || 'Vendor';
                            return (
                                <li key={idx} className="flex justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-500">Vendor: {vendor}</p>
                                    </div>
                                    <p className="font-bold">
                                        ₹{item.price} × {item.quantity}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
