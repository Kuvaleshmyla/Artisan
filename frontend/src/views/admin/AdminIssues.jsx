import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

const AdminIssues = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get('/api/orders/all', { withCredentials: true });
                setOrders(data.filter((o) => o.issue && String(o.issue).trim()));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return <div className="py-12 text-center text-gray-500">Loading reported issues…</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-800">Reported issues</h1>
            <p className="text-sm text-gray-500">Customer-reported problems attached to orders.</p>

            {orders.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
                    <AlertTriangle className="mx-auto mb-4 text-gray-300" size={48} />
                    No open issues reported.
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-white rounded-xl border border-red-100 p-6 shadow-sm">
                            <div className="flex flex-wrap justify-between gap-2 mb-2">
                                <span className="font-mono text-sm text-gray-600">Order {order._id.slice(-8)}</span>
                                <span className="text-xs text-gray-400">{new Date(order.updatedAt || order.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-red-800 font-medium">{order.issue}</p>
                            <p className="text-sm text-gray-500 mt-2">Customer: {order.customerId?.name} · {order.customerId?.email}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminIssues;
