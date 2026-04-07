import { Search, Filter, ShoppingCart, User, Heart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useWishlistStore from '../../store/useWishlistStore';
import useCartStore from '../../store/useCartStore';

const Wishlist = () => {
    const navigate = useNavigate();
    const { wishlistItems, toggleWishlist, clearWishlist } = useWishlistStore();
    const { cartItems, addToCart } = useCartStore();

    const isInCart = (productId) => cartItems.some(item => item._id === productId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Heart className="text-red-500 fill-red-500" /> My Saved Artifacts</h1>
                {wishlistItems.length > 0 && (
                    <button onClick={clearWishlist} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1">
                        <Trash2 size={14} /> Clear All
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlistItems.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <Heart size={48} className="mx-auto mb-4 text-gray-300" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No items saved</h2>
                        <p className="mb-6">Explore the artisan catalogue and click the heart icon to save products here.</p>
                        <button type="button" onClick={() => navigate('/dashboard/products')} className="bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition">Browse products</button>
                    </div>
                ) : wishlistItems.map(product => (
                    <div 
                        key={product._id} 
                        onClick={() => navigate(`/dashboard/products/${product._id}`)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:border-brand-300 transition-all flex flex-col cursor-pointer relative"
                    >
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(product);
                            }}
                            className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm hover:scale-110 transition-transform"
                        >
                            <Trash2 size={18} className="text-red-500 hover:text-red-700" />
                        </button>

                        <div className="h-48 bg-gray-100 w-full relative">
                            <img src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/600'} alt={product.name} className="w-full h-full object-cover transition-opacity duration-300" />
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col">
                            <p className="text-xs text-brand-600 font-semibold mb-1 uppercase tracking-wider">{product.category}</p>
                            <h3 className="font-semibold text-gray-800 text-lg mb-1 leading-tight">{product.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1 mb-3 bg-gray-50 p-1.5 rounded-lg border border-gray-200 w-fit">
                                <User size={12} className="text-gray-400" />
                                <p className="text-xs text-gray-600 font-medium truncate">By: {product.artisanId?.businessName || product.artisanId?.name || 'Local Artisan'}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                                <p className="text-gray-900 font-bold text-lg">₹{product.price}</p>
                                
                                {!isInCart(product._id) ? (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart({ ...product, quantity: 1 });
                                        }}
                                        className="text-brand-600 hover:text-white bg-brand-50 hover:bg-brand-600 px-4 py-2 rounded-xl transition-colors shadow-sm text-sm font-bold flex items-center gap-2"
                                    >
                                        <ShoppingCart size={16} /> Move to Cart
                                    </button>
                                ) : (
                                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-lg">Added</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Wishlist;
