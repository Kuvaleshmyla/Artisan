import { Link, Navigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import useCartStore from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';

const Cart = () => {
    const { cartItems, updateQuantity, removeFromCart } = useCartStore();
    const { userInfo } = useAuthStore();

    if (userInfo?.role === 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

    if (cartItems.length === 0) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 mt-4">
                <h1 className="text-3xl font-bold text-gray-800">Your shopping cart</h1>
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🛒</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                    <p className="text-gray-500 mb-6">Browse artisan products and add items to continue.</p>
                    <Link
                        to="/dashboard/products"
                        className="inline-block bg-brand-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
                    >
                        Continue shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 mt-4 pb-20">
            <h1 className="text-3xl font-bold text-gray-800">Your shopping cart</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {cartItems.map((item) => (
                    <div key={item._id} className="p-6 flex flex-col sm:flex-row gap-6">
                        <img
                            src={item.images?.[0] || 'https://via.placeholder.com/120'}
                            alt=""
                            className="w-full sm:w-28 h-28 object-cover rounded-xl bg-gray-50"
                        />
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                                <p className="text-brand-600 font-bold mt-1">₹{item.price} each</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-2 py-1">
                                    <button
                                        type="button"
                                        onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                                        className="p-2 text-gray-600"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-bold w-8 text-center">{item.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                        className="p-2 text-gray-600"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <p className="font-black text-lg min-w-[80px] text-right">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => removeFromCart(item._id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    aria-label="Remove"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Link to="/dashboard/products" className="text-brand-600 font-bold hover:underline inline-flex items-center gap-2">
                    <ShoppingBag size={18} /> Back to products
                </Link>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-2xl font-black text-gray-900">₹{subtotal.toFixed(2)}</p>
                    <Link
                        to="/dashboard/checkout"
                        className="mt-4 inline-block bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700"
                    >
                        Checkout
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Cart;
