import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, BarChart3, ShieldAlert } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [expandedProductId, setExpandedProductId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_BASE_URL}/api/products`);
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Remove this product from the platform?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/products/${productId}`, { withCredentials: true });
            fetchProducts();
        } catch {
            alert('Error removing product');
        }
    };

    const toggleProductStats = (id) => {
        setExpandedProductId(expandedProductId === id ? null : id);
    };

    if (loading) {
        return <div className="py-12 text-center text-gray-500">Loading products…</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-800">Product moderation</h1>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-800">All listings</h2>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{products.length} products</span>
                </div>

                {products.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">No products yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                                    <th className="p-4 rounded-tl-lg font-semibold">Product</th>
                                    <th className="p-4 font-semibold">Price</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">Artisan</th>
                                    <th className="p-4 rounded-tr-lg font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map((product) => (
                                    <React.Fragment key={product._id}>
                                        <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => toggleProductStats(product._id)}>
                                            <td className="p-4 font-bold text-gray-800">
                                                <div className="flex items-center gap-4">
                                                    <img src={product.images?.[0]} alt="" className="w-12 h-12 rounded object-cover border border-gray-200" />
                                                    {product.name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-800 font-medium">₹{product.price}</td>
                                            <td className="p-4 text-gray-500 font-medium">
                                                <span className="bg-brand-50 text-brand-700 px-2 py-1 rounded text-xs uppercase">{product.category}</span>
                                            </td>
                                            <td className="p-4 text-gray-500 font-medium">{product.artisanId?.name || product.artisanId?.businessName || '—'}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProduct(product._id);
                                                    }}
                                                    className="inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={16} /> Remove
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedProductId === product._id && (
                                            <tr className="bg-slate-50 border-b border-gray-200">
                                                <td colSpan={5} className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                                            <div className="flex items-center gap-3 mb-2 text-gray-600">
                                                                <BarChart3 size={18} /> <h4 className="font-semibold text-sm">Listing</h4>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Stock: {product.stock ?? '—'}</p>
                                                        </div>
                                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                                            <div className="flex items-center gap-3 mb-2 text-gray-600">
                                                                <ShieldAlert size={18} /> <h4 className="font-semibold text-sm">Moderation</h4>
                                                            </div>
                                                            <p className="text-xs text-gray-600">Remove listings that violate policy.</p>
                                                        </div>
                                                        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col justify-center">
                                                            <p className="text-xs text-gray-500">{product.description}</p>
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
        </div>
    );
};

export default AdminProducts;
