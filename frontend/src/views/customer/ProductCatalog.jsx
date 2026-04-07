import { useState, useEffect } from 'react';
import { ShoppingCart, User, Eye, Heart, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useCartStore from '../../store/useCartStore';
import useWishlistStore from '../../store/useWishlistStore';
import axios from 'axios';

const ProductCatalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { cartItems, addToCart } = useCartStore();
    const { wishlistItems, toggleWishlist } = useWishlistStore();

    const keywordFromUrl = searchParams.get('keyword') || searchParams.get('q') || '';
    const categoryFromUrl = searchParams.get('category') || '';

    useEffect(() => {
        let cancelled = false;
        axios
            .get('/api/products/meta/categories')
            .then(({ data }) => {
                if (!cancelled) setCategories(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!cancelled) setCategories([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const query = {};
        if (keywordFromUrl) query.keyword = keywordFromUrl;
        if (categoryFromUrl) query.category = categoryFromUrl;
        const params = Object.keys(query).length ? { params: query } : {};
        axios
            .get('/api/products', params)
            .then(({ data }) => {
                if (!cancelled) setProducts(data);
            })
            .catch(() => {
                if (!cancelled) setProducts([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [keywordFromUrl, categoryFromUrl]);

    const isInCart = (productId) => cartItems.some((item) => item._id === productId);
    const isInWishlist = (productId) => wishlistItems.some((item) => item._id === productId);

    const artisanLabel = (product) => {
        const a = product.artisanId;
        if (!a) return { workshop: null, maker: null };
        const workshop = a.businessName?.trim() || null;
        const maker = a.name?.trim() || null;
        return { workshop, maker };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-xl font-bold text-gray-800">Explore artisan catalog</h1>
                {keywordFromUrl ? (
                    <p className="text-sm text-gray-500">
                        Results for <span className="font-semibold text-gray-800">&ldquo;{keywordFromUrl}&rdquo;</span>
                    </p>
                ) : null}

                <div className="flex items-center gap-3">
                    <select
                        value={categoryFromUrl}
                        onChange={(e) => {
                            const v = e.target.value;
                            const qp = new URLSearchParams();
                            if (keywordFromUrl) qp.set('keyword', keywordFromUrl);
                            if (v) qp.set('category', v);
                            const queryStr = qp.toString();
                            navigate(queryStr ? `/dashboard/products?${queryStr}` : '/dashboard/products', { replace: true });
                        }}
                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        aria-label="Filter by category"
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {loading && products.length === 0 ? (
                    <div className="col-span-full py-16 flex justify-center text-gray-400">
                        <Loader2 className="animate-spin" size={40} />
                    </div>
                ) : products.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>
                            {keywordFromUrl
                                ? 'No products match your search. Use the search bar above to try another artisan name, category, or product name.'
                                : 'No products in the catalog yet.'}
                        </p>
                    </div>
                ) : (
                    products.map((product) => {
                        const { workshop, maker } = artisanLabel(product);
                        const aid = product.artisanId?._id || product.artisanId;
                        const showBoth = workshop && maker && workshop !== maker;

                        return (
                            <div
                                key={product._id}
                                role="button"
                                tabIndex={0}
                                onClick={() => navigate(`/dashboard/products/${product._id}`)}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/dashboard/products/${product._id}`)}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl hover:border-brand-300 transition-all flex flex-col cursor-pointer relative"
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist(product);
                                    }}
                                    className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm hover:scale-110 transition-transform"
                                >
                                    <Heart size={20} className={isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                                </button>

                                <div className="h-48 bg-gray-100 w-full relative" onClick={(e) => e.stopPropagation()}>
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
                                    />
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <p className="text-xs text-brand-600 font-semibold mb-1 uppercase tracking-wider">{product.category}</p>
                                    <h3 className="font-semibold text-gray-800 text-lg mb-3 leading-tight">{product.name}</h3>

                                    <div className="rounded-lg bg-brand-50/80 border border-brand-100 px-3 py-2.5 mb-3">
                                        <div className="flex items-start gap-2">
                                            <User size={16} className="text-brand-600 shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700 mb-0.5">Artisan</p>
                                                {showBoth ? (
                                                    <>
                                                        <p className="text-sm font-bold text-gray-900 leading-snug">{workshop}</p>
                                                        <p className="text-xs text-gray-700 mt-0.5 font-medium">Maker: {maker}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-sm font-bold text-gray-900 leading-snug">
                                                        {workshop || maker || 'Local artisan'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {aid && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/dashboard/artisan/${aid}`);
                                                }}
                                                className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 py-1.5 rounded-md hover:bg-brand-100/80 transition-colors"
                                            >
                                                View artisan profile <Eye size={12} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                                        <p className="text-gray-900 font-bold text-lg">₹{product.price}</p>

                                        {!isInCart(product._id) ? (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addToCart({ ...product, quantity: 1 });
                                                }}
                                                className="text-brand-600 hover:text-white bg-brand-50 hover:bg-brand-600 p-2.5 rounded-xl transition-colors shadow-sm"
                                            >
                                                <ShoppingCart size={18} />
                                            </button>
                                        ) : (
                                            <div className="text-green-600 bg-green-50 p-2.5 rounded-xl shadow-sm">
                                                <CheckCircle2 size={18} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ProductCatalog;
