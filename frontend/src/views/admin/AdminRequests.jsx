import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, Mail, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AdminRequests = () => {
    const [profiles, setProfiles] = useState([]);
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/artisans/admin/profiles?pending=true`, { withCredentials: true });
            setProfiles(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const approve = async (profileId) => {
        try {
            setBusyId(profileId);
            await axios.put(`${API_BASE_URL}/api/artisans/admin/verify/${profileId}`, {}, { withCredentials: true });
            await load();
        } catch (e) {
            alert(e.response?.data?.message || 'Approve failed');
        } finally {
            setBusyId(null);
        }
    };

    const reject = async (userId, name) => {
        if (!window.confirm(`Reject application for ${name}? Their account will be removed and they may register again.`)) return;
        try {
            setBusyId(userId);
            await axios.delete(`${API_BASE_URL}/api/auth/artisans/pending/${userId}`, { withCredentials: true });
            setProfiles((prev) => prev.filter((p) => String(p.userId?._id) !== String(userId)));
            await load();
        } catch (e) {
            alert(e.response?.data?.message || 'Reject failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Requests</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Pending artisan applications. Approve to list them under Artisans; reject removes the account so they can sign up again.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-4">Applicant</th>
                            <th className="p-4">Craft / region</th>
                            <th className="p-4">Storefront</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {profiles.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    No pending requests.
                                </td>
                            </tr>
                        ) : (
                            profiles.map((p) => (
                                <tr key={p._id}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3 font-semibold text-gray-800 dark:text-gray-100">
                                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded flex items-center justify-center shrink-0">
                                                <Briefcase size={20} />
                                            </div>
                                            <div>
                                                <div>{p.businessName || p.userId?.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 font-normal inline-flex items-center gap-2 mt-1">
                                                    <Mail size={14} /> {p.userId?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="font-medium text-gray-800 dark:text-gray-100">{p.craftType || '—'}</div>
                                        <div className="text-xs text-gray-500">
                                            {[p.region, p.state, p.country].filter(Boolean).join(', ') || '—'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {p.userId?._id ? (
                                            <Link
                                                to={`/dashboard/artisan/${p.userId._id}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                                            >
                                                <ExternalLink size={14} />
                                                View page
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                            <button
                                                type="button"
                                                disabled={busyId === p._id || busyId === p.userId?._id}
                                                onClick={() => approve(p._id)}
                                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 hover:bg-green-50 dark:hover:bg-green-950/30 disabled:opacity-50"
                                            >
                                                <CheckCircle2 size={14} /> Approve
                                            </button>
                                            <button
                                                type="button"
                                                disabled={busyId === p.userId?._id}
                                                onClick={() => reject(p.userId?._id, p.userId?.name || 'applicant')}
                                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminRequests;
