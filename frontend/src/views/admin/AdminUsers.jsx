import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Trash2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [removingId, setRemovingId] = useState(null);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/auth/customers`, { withCredentials: true });
            setUsers(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRemove = async (id, name) => {
        if (!window.confirm(`Revoke access for ${name}? They will not be able to log in again.`)) return;
        try {
            setRemovingId(id);
            await axios.delete(`${API_BASE_URL}/api/auth/users/${id}`, { withCredentials: true });
            await fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not revoke access');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
            <p className="text-sm text-gray-500">Remove revokes login access (account is restricted, not permanently deleted).</p>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left table-fixed">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-sm">
                        <tr>
                            <th className="p-4 w-[28%] align-middle">User</th>
                            <th className="p-4 w-[36%] align-middle">Contact</th>
                            <th className="p-4 w-[20%] align-middle text-right">Join date</th>
                            <th className="p-4 w-[16%] align-middle text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u._id} className="hover:bg-gray-50">
                                <td className="p-4 align-middle">
                                    <div className="flex items-center gap-3 font-semibold text-gray-800">
                                        <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded flex items-center justify-center shrink-0">
                                            <User size={20}/>
                                        </div>
                                        <span className="truncate">{u.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 align-middle text-gray-600">
                                    <span className="inline-flex items-center gap-2 min-w-0">
                                        <Mail size={16} className="shrink-0 text-gray-400" />
                                        <span className="truncate">{u.email}</span>
                                    </span>
                                </td>
                                <td className="p-4 align-middle text-right text-gray-500 text-sm whitespace-nowrap">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(u._id, u.name)}
                                        disabled={removingId === u._id}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 disabled:opacity-50"
                                    >
                                        <Trash2 size={14} />
                                        {removingId === u._id ? 'Removing…' : 'Remove'}
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
export default AdminUsers;
