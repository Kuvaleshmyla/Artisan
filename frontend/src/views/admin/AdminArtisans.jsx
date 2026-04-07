import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, Mail, Trash2, ExternalLink } from 'lucide-react';

const AdminArtisans = () => {
    const [profiles, setProfiles] = useState([]);
    const [removingId, setRemovingId] = useState(null);

    const fetchProfiles = async () => {
        try {
            const { data } = await axios.get('/api/artisans/admin/profiles?pending=false', { withCredentials: true });
            setProfiles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleRemove = async (artisanUserId, name) => {
        if (!window.confirm(`Revoke access for artisan ${name}? They will not be able to log in again.`)) return;
        try {
            setRemovingId(artisanUserId);
            await axios.delete(`/api/auth/artisans/${artisanUserId}`, { withCredentials: true });
            setProfiles((prev) => prev.filter((p) => String(p.userId?._id) !== String(artisanUserId)));
            await fetchProfiles();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not revoke access');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Artisans</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Approved artisans on the marketplace. New applications are under <strong>Requests</strong>.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase text-sm">
                        <tr>
                            <th className="p-4">Artisan</th>
                            <th className="p-4">Craft / Region</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Storefront</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {profiles.map((p) => (
                            <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3 font-semibold text-gray-800 dark:text-gray-100">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded flex items-center justify-center shrink-0">
                                            <Briefcase size={20}/>
                                        </div>
                                        <span className="truncate">{p.businessName || p.userId?.name}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <span className="inline-flex items-center gap-2">
                                            <Mail size={16} />
                                            <span className="truncate">{p.userId?.email}</span>
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.craftType || '—'}</div>
                                    <div className="text-xs text-gray-500">
                                        {[p.region, p.state, p.country].filter(Boolean).join(', ') || '—'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded text-xs uppercase tracking-widest font-bold">
                                        Live
                                    </span>
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
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(p.userId?._id, p.userId?.name || 'artisan')}
                                        disabled={removingId === p.userId?._id}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-1.5 disabled:opacity-50"
                                    >
                                        <Trash2 size={14} />
                                        {removingId === p.userId?._id ? 'Removing…' : 'Remove'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default AdminArtisans;
