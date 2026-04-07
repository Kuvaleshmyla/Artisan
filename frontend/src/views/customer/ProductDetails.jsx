import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Heart, MapPin, Truck, ShieldCheck, ChevronRight, User, Loader2, MessageSquare, CheckCircle2, Zap } from 'lucide-react';
import useCartStore from '../../store/useCartStore';
import useWishlistStore from '../../store/useWishlistStore';
import useAuthStore from '../../store/useAuthStore';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [imageIndex, setImageIndex] = useState(0);
    
    const { cartItems, addToCart } = useCartStore();
    const { wishlistItems, toggleWishlist } = useWishlistStore();
    const { userInfo } = useAuthStore();

    const fetchProduct = async () => {
        try {
            const { data } = await axios.get(`/api/products/${id}`);
            setProduct(data);
        } catch (err) {
            setError('Failed to fetch product details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    useEffect(() => {
        setImageIndex(0);
    }, [id, product?._id]);

    const submitReview = async (e) => {
        e.preventDefault();
        if (rating === 0 || !comment) {
            alert('Please select a rating and enter a comment.');
            return;
        }
        setSubmittingReview(true);
        try {
            await axios.post(`/api/products/${id}/reviews`, { rating, comment }, { withCredentials: true });
            alert('Feedback submitted successfully!');
            setRating(0);
            setComment('');
            fetchProduct(); // Refresh reviews
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit feedback.');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-brand-600"><Loader2 size={48} className="animate-spin" /></div>;
    if (error || !product) return <div className="text-center py-20 text-red-500 font-bold">{error || 'Product not found'}</div>;

    const isInCart = cartItems.some(item => item._id === product._id);
    const isInWishlist = wishlistItems.some(item => item._id === product._id);
    const isAdmin = userInfo?.role === 'admin';
    const artisanUserId = product.artisanId?._id || product.artisanId;

    const imgs = product?.images?.filter(Boolean) || [];
    const mainSrc =
        imgs[imageIndex] ||
        (imgs.length ? imgs[0] : 'https://via.placeholder.com/600');

    const buyNow = () => {
        if (isAdmin) {
            alert('Administrator accounts cannot place orders.');
            return;
        }
        addToCart({ ...product, quantity: selectedQuantity });
        navigate('/dashboard/checkout');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 pb-24">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
                <button onClick={() => navigate('/dashboard/products')} className="hover:text-brand-600 transition-colors">Catalog</button>
                <ChevronRight size={16} />
                <span className="text-gray-900 dark:text-gray-100">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                {/* Visual Artifact Column */}
                <div className="space-y-6">
                    <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm relative group">
                        {/* Wishlist Heart Toggle */}
                        <button 
                            onClick={() => toggleWishlist(product)}
                            className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer border border-gray-100"
                        >
                            <Heart size={24} className={isInWishlist ? "fill-red-500 text-red-500" : "text-gray-400"} />
                        </button>
                        <img 
                            src={mainSrc} 
                            alt={product.name} 
                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isInCart ? 'opacity-80' : ''}`} 
                        />
                        {isInCart && (
                            <div className="absolute inset-0 bg-brand-900/10 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="bg-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-brand-700 font-black text-lg">
                                    <ShoppingCart className="fill-brand-600" /> In Dashboard Cart
                                </div>
                            </div>
                        )}
                    </div>
                    {imgs.length > 1 ? (
                        <div className="flex flex-wrap gap-2">
                            {imgs.map((src, i) => (
                                <button
                                    key={src + i}
                                    type="button"
                                    onClick={() => setImageIndex(i)}
                                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                                        i === imageIndex ? 'border-brand-600 ring-2 ring-brand-200' : 'border-gray-200 dark:border-gray-700 opacity-80 hover:opacity-100'
                                    }`}
                                >
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Product Metadata & Execution Column */}
                <div className="flex flex-col justify-center">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-brand-50 text-brand-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">{product.category}</span>
                            <div className="flex items-center gap-1 text-orange-400 bg-orange-50 px-2 py-1 rounded-lg">
                                <Star size={14} className="fill-orange-400" />
                                <span className="text-xs font-bold text-orange-600">{product.ratings?.average?.toFixed(1) || 0} ({product.ratings?.count || 0} Feedback)</span>
                            </div>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight">{product.name}</h1>
                        <p className="text-3xl font-black text-brand-600 mb-6">₹{product.price}</p>
                        <p className="text-lg text-gray-600 leading-relaxed font-medium">{product.description}</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                            <User size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Authentic Maker</p>
                            <p className="text-lg font-bold text-gray-900">{product.artisanId?.businessName || product.artisanId?.name || 'Artisan Workshop'}</p>
                            {artisanUserId && (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/dashboard/artisan/${artisanUserId}`)}
                                    className="mt-2 text-sm font-bold text-brand-600 hover:underline"
                                >
                                    View artisan profile & products
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <Truck size={20} className="text-brand-500" /> <span>Estimated Delivery: <strong className="text-gray-900">3-5 Business Days</strong></span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <MapPin size={20} className="text-brand-500" /> <span>Ships exactly from artisan studio</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <ShieldCheck size={20} className="text-brand-500" /> <span>100% Secure Encrypted QR Verification</span>
                        </div>
                    </div>

                    {!isInCart ? (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-2 w-full sm:w-1/3 justify-between">
                                <button type="button" onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white rounded-xl shadow-sm hover:text-brand-600 transition-colors">-</button>
                                <span className="font-bold text-lg text-gray-800">{selectedQuantity}</span>
                                <button type="button" onClick={() => setSelectedQuantity(selectedQuantity + 1)} className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white rounded-xl shadow-sm hover:text-brand-600 transition-colors">+</button>
                            </div>
                            <div className="flex flex-wrap gap-3 flex-1">
                                <button 
                                    type="button"
                                    disabled={isAdmin}
                                    onClick={() => {
                                        if (isAdmin) return;
                                        addToCart({ ...product, quantity: selectedQuantity });
                                    }}
                                    className="flex-1 min-w-[140px] bg-gray-900 text-white py-4 rounded-2xl font-bold uppercase tracking-wide hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={22} /> Add to cart
                                </button>
                                <button 
                                    type="button"
                                    disabled={isAdmin}
                                    onClick={buyNow}
                                    className="flex-1 min-w-[140px] bg-brand-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Zap size={22} /> Buy now
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                type="button"
                                onClick={() => navigate('/dashboard/cart')}
                                className="bg-gray-50 text-gray-900 border border-gray-200 w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={22} /> View cart
                            </button>
                            <button 
                                type="button"
                                onClick={() => navigate('/dashboard/checkout')}
                                className="bg-green-600 text-white w-full py-5 rounded-2xl font-black text-xl hover:bg-green-700 transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={24} /> Go to checkout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Feedback Block */}
            <div className="mt-20 border-t border-gray-100 pt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1">
                    <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="text-brand-500" /> Feedback Facility
                    </h2>
                    <p className="text-gray-500 font-medium mb-8">Share your authentic experience with this handcrafted artifact.</p>

                    {userInfo?.role === 'customer' ? (
                        <form onSubmit={submitReview} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Quality Rating Matrix</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star} type="button" 
                                            onClick={() => setRating(star)}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star size={28} className={star <= rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Written Analysis</label>
                                <textarea 
                                    value={comment} onChange={e => setComment(e.target.value)} 
                                    className="w-full p-4 border border-gray-200 rounded-xl resize-none h-32 outline-none focus:border-brand-500 transition-colors bg-white font-medium" 
                                    placeholder="Analyze the material composition, precision, and delivery timeline..."
                                ></textarea>
                            </div>
                            <button type="submit" disabled={submittingReview} className="w-full bg-brand-900 text-white font-bold py-3 rounded-xl hover:bg-black transition disabled:opacity-50">
                                {submittingReview ? 'Pushing Data...' : 'Submit Feedback Vector'}
                            </button>
                        </form>
                    ) : (
                        <div className="bg-brand-50 p-6 rounded-xl border border-brand-100 text-brand-700 font-bold">
                            Only active customers can publish verification arrays.
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Customer Transcripts</h3>
                    {product.reviews && product.reviews.length > 0 ? (
                        product.reviews.map((review, index) => (
                            <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-600">
                                            {review.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{review.name}</p>
                                            <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={14} className={star <= review.rating ? 'fill-orange-400 text-orange-400' : 'text-orange-200/50'} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-600 font-medium leading-relaxed">{review.comment}</p>
                            </div>
                        ))
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={48} className="mb-4 text-gray-300" />
                            <p className="font-bold text-lg text-gray-500">No telemetry logged yet.</p>
                            <p className="text-sm mt-1">Be the first to analyze this artifact.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ProductDetails;
