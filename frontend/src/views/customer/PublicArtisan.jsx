import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, ShoppingCart, Heart, Loader2 } from 'lucide-react';
import useCartStore from '../../store/useCartStore';
import useWishlistStore from '../../store/useWishlistStore';
import useAuthStore from '../../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const waitAuthHydration = () =>
    new Promise((resolve) => {
        if (useAuthStore.persist.hasHydrated()) resolve();
        else useAuthStore.persist.onFinishHydration(() => resolve());
    });

const PublicArtisan = () => {
    const { artisanId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { cartItems, addToCart } = useCartStore();
    const { wishlistItems, toggleWishlist } = useWishlistStore();
    const userInfo = useAuthStore((s) => s.userInfo);
    const userRole = userInfo?.role;

    useEffect(() => {
        if (!artisanId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await waitAuthHydration();
                if (cancelled) return;
                const isAdmin = useAuthStore.getState().userInfo?.role === 'admin';
                const cred = { withCredentials: true };
                const profileUrl = isAdmin
                    ? `${API_BASE_URL}/api/artisans/admin/preview/${artisanId}`
                    : `${API_BASE_URL}/api/artisans/public/${artisanId}`;
                const [pRes, prodRes] = await Promise.all([
                    axios.get(profileUrl, cred),
                    axios.get(`${API_BASE_URL}/api/products`, { ...cred, params: { artisan: artisanId } }),
                ]);
                if (cancelled) return;
                setProfile(pRes.data);
                setProducts(prodRes.data);
            } catch (e) {
                console.error(e);
                if (!cancelled) setProfile(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [artisanId, userInfo?._id, userRole]);

    if (loading) {
        return (
            <div className="flex justify-center py-24 text-brand-600">
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20 text-gray-600">
                Artisan not found.
                <button type="button" className="block mx-auto mt-4 text-brand-600 font-bold" onClick={() => navigate('/dashboard/products')}>
                    Back to catalog
                </button>
            </div>
        );
    }

    const displayName = profile.businessName || profile.userId?.name || 'Artisan';
    const isInCart = (productId) => cartItems.some((item) => item._id === productId);
    const isInWishlist = (productId) => wishlistItems.some((item) => item._id === productId);
    const isAdminViewer = userRole === 'admin';
    const canSeeWorkshopMedia =
        userRole === 'admin' ||
        (userRole === 'artisan' && userInfo?._id && String(userInfo._id) === String(artisanId));
    const showPendingBanner = isAdminViewer && profile.marketplaceActive === false;
    const showRevokedBanner = isAdminViewer && profile.userId?.status === 'banned';

    return (
        <div className="space-y-8 pb-20">
            {showPendingBanner ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                    Admin preview: this application is not approved yet — customers do not see this storefront.
                </div>
            ) : null}
            {showRevokedBanner ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                    Admin preview: this account has been removed from the marketplace (restricted sign-in).
                </div>
            ) : null}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold">
                    <User size={36} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                    <p className="text-gray-600 mt-2 max-w-2xl">{profile.description}</p>
                    {(profile.craftType || profile.region || profile.state || profile.country) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {profile.craftType ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold border border-brand-100">
                                    {profile.craftType}
                                </span>
                            ) : null}
                            {profile.region || profile.state || profile.country ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-xs font-bold border border-gray-100">
                                    {[
                                        profile.region,
                                        profile.state,
                                        profile.country,
                                    ]
                                        .filter(Boolean)
                                        .join(', ')}
                                </span>
                            ) : null}
                        </div>
                    )}
                    {profile.workExperience ? (
                        <p className="text-sm text-gray-500 mt-4 whitespace-pre-line">{profile.workExperience}</p>
                    ) : null}
                </div>
            </div>

            {canSeeWorkshopMedia && profile.workVideo ? (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Craft in motion</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Not visible to customers — only this artisan and platform admins can see this on the storefront.
                    </p>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-black max-w-3xl">
                        <video
                            src={profile.workVideo}
                            controls
                            playsInline
                            className="w-full max-h-[min(70vh,480px)] object-contain bg-black"
                        >
                            Your browser does not support video playback.
                        </video>
                    </div>
                </div>
            ) : null}

            {canSeeWorkshopMedia && profile.galleryImages && profile.galleryImages.length > 0 ? (
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Workshop gallery</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Not visible to customers — only this artisan and platform admins can see these on the storefront.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {profile.galleryImages.map((src) => (
                            <a
                                key={src}
                                href={src}
                                target="_blank"
                                rel="noreferrer"
                                className="block aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                            >
                                <img src={src} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                            </a>
                        ))}
                    </div>
                </div>
            ) : null}

            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Products by this artisan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 py-12">No products listed yet.</p>
                ) : (
                    products.map((product) => (
                        <div
                            key={product._id}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/dashboard/products/${product._id}`)}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/dashboard/products/${product._id}`)}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer relative"
                        >
                            <button
                                type="button"
                                className="absolute top-3 right-3 z-10 p-2 bg-white/80 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWishlist(product);
                                }}
                            >
                                <Heart size={18} className={isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                            </button>
                            <div className="h-48 bg-gray-100">
                                <img src={product.images?.[0]} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-brand-600 font-semibold uppercase">{product.category}</p>
                                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="font-bold text-lg">₹{product.price}</span>
                                    {!isInCart(product._id) ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart({ ...product, quantity: 1 });
                                            }}
                                            className="p-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white"
                                        >
                                            <ShoppingCart size={18} />
                                        </button>
                                    ) : (
                                        <span className="text-xs text-green-600 font-bold">In cart</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PublicArtisan;
