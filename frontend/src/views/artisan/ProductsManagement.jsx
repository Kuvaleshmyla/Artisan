import { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const emptyForm = { name: '', price: '', description: '', category: '', stock: '1', imageUrls: [] };

const ProductsManagement = () => {
    const { userInfo } = useAuthStore();
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [saving, setSaving] = useState(false);

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/products/artisan/mine`, { withCredentials: true });
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching products', error);
        }
    };

    useEffect(() => {
        if (userInfo?._id) fetchProducts();
    }, [userInfo]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setPendingFiles([]);
        setShowForm(true);
    };

    const openEdit = (product) => {
        setEditingId(product._id);
        setForm({
            name: product.name,
            price: String(product.price),
            description: product.description,
            category: product.category,
            stock: String(product.stock ?? 1),
            imageUrls: [...(product.images || [])],
        });
        setPendingFiles([]);
        setShowForm(true);
    };

    const removeImageUrl = (url) => {
        setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((u) => u !== url) }));
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const uploaded = [];
            for (const file of pendingFiles) {
                const fd = new FormData();
                fd.append('image', file);
                const { data: url } = await axios.post(`${API_BASE_URL}/api/upload`, fd, { withCredentials: true });
                uploaded.push(typeof url === 'string' ? url : String(url));
            }
            const images = [...form.imageUrls, ...uploaded].filter(Boolean);
            if (images.length < 1) {
                alert('Add at least one product image (upload files and/or keep existing URLs).');
                setSaving(false);
                return;
            }

            const payload = {
                name: form.name,
                price: Number(form.price),
                description: form.description,
                category: form.category,
                stock: Number(form.stock),
                images,
            };

            if (editingId) {
                await axios.put(`${API_BASE_URL}/api/products/${editingId}`, payload, { withCredentials: true });
            } else {
                await axios.post(`${API_BASE_URL}/api/products`, payload, { withCredentials: true });
            }

            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);
            setPendingFiles([]);
            fetchProducts();
        } catch (error) {
            console.error('Failed to save product', error);
            alert('Could not save product.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product permanently?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/products/${id}`, { withCredentials: true });
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert('Failed to delete product.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">My products</h1>
                <button 
                    type="button"
                    onClick={() => {
                        if (showForm) {
                            setShowForm(false);
                            setEditingId(null);
                            setForm(emptyForm);
                            setPendingFiles([]);
                        } else {
                            openCreate();
                        }
                    }}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    <span>{showForm ? 'Close' : 'Add product'}</span>
                </button>
            </div>
            
            {showForm && (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{editingId ? 'Edit product' : 'New product'}</h2>
                    <form onSubmit={submitHandler} className="space-y-4 max-w-2xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product name</label>
                                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <input type="text" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                                <input type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product images</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload one or more JPG/PNG files. They are stored with your product.</p>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                multiple
                                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-900/40"
                                onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
                            />
                            {pendingFiles.length > 0 && (
                                <p className="text-xs text-brand-700 dark:text-brand-400 mt-2">{pendingFiles.length} new file(s) will upload on save.</p>
                            )}
                            {form.imageUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {form.imageUrls.map((url) => (
                                        <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImageUrl(url)}
                                                className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea required rows="4" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100" />
                        </div>
                        <button type="submit" disabled={saving} className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 w-full mt-4 disabled:opacity-50">
                            {saving ? 'Saving…' : editingId ? 'Update product' : 'Publish product'}
                        </button>
                    </form>
                </div>
            )}

            {!showForm && products.length === 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden p-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                    <div className="text-5xl mb-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-full">🎨</div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No products listed</h3>
                    <p className="max-w-md mx-auto">Add your first product using the button above.</p>
                </div>
            )}

            {!showForm && products.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product._id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                            <img src={product.images?.[0]} alt={product.name} className="h-48 w-full object-cover" />
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{product.name}</h3>
                                    <p className="font-bold text-brand-600">₹{product.price}</p>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                                <div className="mt-auto flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button type="button" onClick={() => openEdit(product)} className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button type="button" onClick={() => handleDelete(product._id)} className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition-colors">
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductsManagement;
