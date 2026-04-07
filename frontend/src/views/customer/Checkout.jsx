import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import { MapPin, QrCode, CheckCircle2, Plus, Minus, Trash2, Smartphone, Building, User, Phone, Check, Loader2 } from 'lucide-react';
import axios from 'axios';

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, updateQuantity, removeFromCart, clearCart } = useCartStore();
    const { userInfo } = useAuthStore();
    
    // UI State
    const [step, setStep] = useState(1);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [globalLoading, setGlobalLoading] = useState(false);
    
    // Address State
    const [savedAddresses, setSavedAddresses] = useState([
        { id: 1, name: userInfo?.name || 'Customer Name', phone: '+91 9876543210', email: userInfo?.email || 'customer@gmail.com', street: '123 Artisan Valley', city: 'Hyderabad', state: 'TS', zip: '500081', country: 'India', isDefault: true }
    ]);
    const [selectedAddressId, setSelectedAddressId] = useState(1);
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ name: '', email: '', phone: '', street: '', city: '', state: '', zip: '', country: 'India' });

    // Payment State
    const [qrUploadedUrl, setQrUploadedUrl] = useState(null);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const [artisanQRCode, setArtisanQRCode] = useState(null);

    // Fetching Artisan QR Code Dynamically
    useEffect(() => {
        const fetchArtisanQR = async () => {
            if (cartItems.length > 0 && cartItems[0].artisanId) {
                const artisanIdStr = typeof cartItems[0].artisanId === 'object' ? cartItems[0].artisanId._id : cartItems[0].artisanId;
                if (artisanIdStr) {
                    try {
                        const { data } = await axios.get(`/api/artisans/${artisanIdStr}/qrcode`);
                        if (data?.qrCodeImage) {
                            setArtisanQRCode(data.qrCodeImage);
                        }
                    } catch (error) {
                        console.error('Failed to fetch artisan QR code:', error);
                    }
                }
            }
        };
        fetchArtisanQR();
    }, [cartItems]);

    // Calculators
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 150.00;
    const taxes = subtotal * 0.08;
    const orderTotal = subtotal + shipping + taxes;

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const getActiveAddress = () => savedAddresses.find(a => a.id === selectedAddressId) || newAddress;

    const handleAddAddress = () => {
        if (!newAddress.street || !newAddress.city || !newAddress.phone || !newAddress.name) {
            alert('Please fill out all required fields.');
            return;
        }
        const newAddrObj = { ...newAddress, id: Date.now(), isDefault: false };
        setSavedAddresses([...savedAddresses, newAddrObj]);
        setSelectedAddressId(newAddrObj.id);
        setIsAddingNewAddress(false);
        setNewAddress({ name: '', email: '', phone: '', street: '', city: '', state: '', zip: '', country: 'India' });
    };

    const handleReceiptUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingReceipt(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const { data: imageUrl } = await axios.post('/api/upload', formData, { withCredentials: true });
            setQrUploadedUrl(imageUrl);
        } catch (err) {
            alert('Failed to push receipt image to global storage. Try again.');
        } finally {
            setUploadingReceipt(false);
        }
    };

    const handleQRPayment = async () => {
        if (!qrUploadedUrl) {
            alert('Please upload your payment screenshot before completing the order.');
            return;
        }
        setGlobalLoading(true);

        try {
            const activeAddr = getActiveAddress();
            const { data } = await axios.post('/api/orders', {
                orderItems: cartItems.map(item => ({
                    productId: item._id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    artisanId: typeof item.artisanId === 'object' ? item.artisanId._id : item.artisanId
                })),
                shippingAddress: activeAddr,
                paymentMethod: 'qr_upload',
                totalAmount: orderTotal,
                paymentScreenshot: qrUploadedUrl
            }, { withCredentials: true });
            
            setCompletedOrder({ ...data, transactionRef: `QR_ACK_${Date.now()}` });
            clearCart();
            setStep(4);
        } catch (error) {
            alert('Backend synchronization failed. Please check your network connection.');
            console.error(error);
        } finally {
            setGlobalLoading(false);
        }
    };

    if (userInfo?.role === 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    if (cartItems.length === 0 && step !== 4) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-gray-300" size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any artisan products to checkout yet.</p>
                <button onClick={() => navigate('/dashboard/products')} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition">Return to catalog</button>
            </div>
        );
    }

    return (
        <div className="relative max-w-6xl mx-auto space-y-6 mt-4 pb-24 px-4 sm:px-6 lg:px-8">
            
            {globalLoading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <Loader2 size={64} className="text-brand-600 animate-spin mb-6" />
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Processing your verification</h2>
                    <p className="text-gray-500 font-medium text-lg">Please wait, logging handshake sequence...</p>
                </div>
            )}

            {step !== 4 && <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">Secure Checkout</h1>}
            
            {step !== 4 && (
                <div className="flex items-center justify-between mb-10 mx-auto relative mt-8 overflow-hidden pl-2 pr-2">
                    {['Shipping Route', 'Verify Invoice', 'Artisan Link'].map((label, idx) => (
                        <div key={label} className="flex flex-col items-center relative z-10 bg-gray-50/80 px-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-3 transition-colors duration-500 shadow-sm border-2 ${step > idx ? 'bg-brand-600 text-white border-brand-600' : step === idx + 1 ? 'bg-brand-50 text-brand-600 border-brand-400 border-dashed' : 'bg-white text-gray-300 border-gray-200'}`}>
                                {step > idx + 1 ? <CheckCircle2 size={24} /> : idx + 1}
                            </div>
                            <span className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold text-center ${step >= idx + 1 ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                        </div>
                    ))}
                    <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
                    <div className="absolute top-6 left-0 h-0.5 bg-brand-600 -z-10 transition-all duration-700 ease-in-out" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                </div>
            )}

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative">
                
                {step === 1 && (
                    <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                            <div className="p-3 bg-brand-50 rounded-xl text-brand-600"><MapPin size={24} /></div>
                            <h2 className="text-2xl font-bold text-gray-900">Where should we deliver?</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                            <div className="lg:col-span-3 space-y-8">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Saved Locations</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {savedAddresses.map(addr => (
                                            <div 
                                                key={addr.id} 
                                                onClick={() => { setSelectedAddressId(addr.id); setIsAddingNewAddress(false); }}
                                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id && !isAddingNewAddress ? 'border-brand-500 bg-brand-50/30' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-bold text-gray-900 flex items-center gap-2">{addr.name}</p>
                                                    {selectedAddressId === addr.id && !isAddingNewAddress && <CheckCircle2 className="text-brand-500" size={20} />}
                                                </div>
                                                <p className="text-gray-600 text-sm leading-relaxed max-w-[200px] truncate">{addr.street}, {addr.city}</p>
                                            </div>
                                        ))}
                                        <div 
                                            onClick={() => { setIsAddingNewAddress(true); setSelectedAddressId(null); }}
                                            className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isAddingNewAddress ? 'border-brand-500 bg-brand-50/30 text-brand-600' : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-brand-300 hover:text-brand-500'}`}
                                        >
                                            <Plus size={28} className="mb-2" />
                                            <p className="font-bold text-sm">Add New Address</p>
                                        </div>
                                    </div>
                                </div>

                                {isAddingNewAddress && (
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18}/><input type="text" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl" placeholder="Full Name" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} /></div>
                                            <div className="relative"><Phone className="absolute left-3 top-3 text-gray-400" size={18}/><input type="text" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl" placeholder="+91 XXXX" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} /></div>
                                            <div className="md:col-span-2 relative"><MapPin className="absolute left-3 top-3 text-gray-400" size={18}/><input type="text" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl" placeholder="123 Main St, Apt 4B" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} /></div>
                                            <div className="relative"><Building className="absolute left-3 top-3 text-gray-400" size={18}/><input type="text" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} /></div>
                                            <input type="text" className="w-full p-3 bg-white border border-gray-200 rounded-xl" placeholder="State 500001" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                                        </div>
                                        <button onClick={handleAddAddress} className="mt-4 bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold w-full">Save Address</button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="lg:col-span-2 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Location View</h3>
                                <div className="bg-slate-100 flex-1 rounded-2xl overflow-hidden border border-gray-200 min-h-[300px] lg:min-h-full relative">
                                    <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d30630.13558296254!2d80.5274105!3d16.334847999999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1774242622532!5m2!1sen!2sin" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 z-10 opacity-90 mix-blend-multiply"></iframe>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-10 mt-10 border-t border-gray-100">
                            <button onClick={handleNext} disabled={!selectedAddressId && !isAddingNewAddress} className="bg-brand-600 text-white px-10 py-4 rounded-xl font-black hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center gap-2">Confirm Logistics</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-brand-500 pl-4">Order Verification</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-6">
                                {cartItems.map((item) => (
                                    <div key={item._id} className="flex gap-6 p-6 border border-gray-100 rounded-2xl bg-white shadow-sm flex-col sm:flex-row">
                                        <div className="w-full sm:w-32 h-40 sm:h-32 bg-gray-50 rounded-xl flex-shrink-0">
                                            <img src={item.images?.[0] || 'https://via.placeholder.com/150'} className="w-full h-full object-cover rounded-xl" />
                                        </div>
                                        <div className="flex flex-col flex-1 justify-between">
                                            <div className="flex justify-between">
                                                <h3 className="font-bold text-xl">{item.name}</h3>
                                                <button onClick={() => removeFromCart(item._id)} className="text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
                                            </div>
                                            <div className="flex mt-4 pt-4 border-t justify-between items-center w-full">
                                                <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-1">
                                                    <button onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center text-gray-500"><Minus size={16}/></button>
                                                    <span className="font-bold text-lg">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-500"><Plus size={16}/></button>
                                                </div>
                                                <p className="font-black text-2xl">₹{(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="lg:col-span-1">
                                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-sm sticky top-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider pb-4 border-b border-gray-200">Financial Link</h3>
                                    <div className="space-y-4 font-medium mb-8">
                                        <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span></div>
                                        <div className="flex justify-between"><span>Platform Tax</span><span>₹{taxes.toFixed(2)}</span></div>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-gray-200 pt-6 mb-8">
                                        <span className="font-bold uppercase tracking-wider text-sm">Grand Total</span>
                                        <span className="text-3xl font-black text-brand-700">₹{orderTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={handleNext} className="w-full bg-brand-600 text-white py-4 rounded-xl font-black text-lg hover:bg-brand-700">Finalize & Pay via QR</button>
                                        <button onClick={handleBack} className="w-full py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-200">Modify Address</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-12 md:p-16 flex flex-col items-center">
                            <h2 className="text-3xl font-black text-purple-700 mb-2">Artisan Master Verify Node</h2>
                            <p className="text-gray-500 font-medium mb-8 text-center max-w-lg">Scan the artisan's exclusive QR gateway below to transfer exactly <strong className="text-gray-900">₹{orderTotal.toFixed(2)}</strong>. Upload your verification receipt to bind the transaction.</p>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-[2rem] border-2 border-purple-100 shadow-inner mb-10 w-full max-w-sm relative">
                                <div className="bg-white border-4 border-white shadow-xl rounded-2xl flex items-center justify-center p-4 min-h-[300px]">
                                    {artisanQRCode ? (
                                        <img src={artisanQRCode} alt="Artisan Payment QR" className="w-full h-full object-contain rounded-xl" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <QrCode size={120} className="mb-4 opacity-50" />
                                            <p className="text-sm font-bold">Standard Network Routing</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full max-w-lg mb-10">
                                <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-brand-300 border-dashed rounded-2xl cursor-pointer bg-brand-50/50 hover:bg-brand-50 transition-colors">
                                    <div className="flex flex-col items-center justify-center p-6 text-center">
                                        {uploadingReceipt ? (
                                            <Loader2 className="animate-spin text-brand-500 mb-2" size={32} />
                                        ) : qrUploadedUrl ? (
                                            <>
                                                <CheckCircle2 className="text-green-500 mb-2" size={36} />
                                                <p className="text-sm font-bold text-gray-700">Receipt Bound Successfully</p>
                                                <p className="text-xs text-gray-500 mt-1">Tap to replace image</p>
                                            </>
                                        ) : (
                                            <>
                                                <Smartphone className="text-brand-500 mb-2" size={36} />
                                                <p className="text-base font-bold text-gray-800">Upload Transaction Screenshot (*)</p>
                                                <p className="text-xs text-gray-500 mt-2 font-medium">PNG, JPG, JPEG allowed. Mandatory for completion.</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleReceiptUpload} />
                                </label>
                            </div>

                            <div className="flex w-full max-w-lg gap-4">
                                <button onClick={handleBack} className="w-1/3 text-gray-500 font-bold hover:bg-gray-100 py-4 rounded-xl transition-all">Cancel Vector</button>
                                <button onClick={handleQRPayment} disabled={!qrUploadedUrl || uploadingReceipt} className="w-2/3 bg-purple-600 text-white py-4 rounded-xl font-black text-lg hover:bg-purple-700 transition shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center">
                                    I have completed payment
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && completedOrder && (
                    <div className="p-12 md:p-20 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-32 h-32 bg-green-100 border-4 border-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-8 relative z-10 transition-transform hover:scale-105">
                            <Check size={64} className="text-green-500" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Order Bound!</h2>
                        <p className="text-lg text-gray-600 font-medium mb-10 max-w-lg mx-auto">Your manual payment token is pending verification by the master Artisan. Tracking has been mapped to <span className="text-gray-900 font-bold">{completedOrder.shippingAddress?.email}</span>.</p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => navigate('/dashboard/orders')} className="bg-brand-600 text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-brand-700 transition">Track order</button>
                            <button onClick={() => navigate('/dashboard/products')} className="bg-white text-gray-700 border-2 border-gray-200 px-10 py-4 rounded-xl font-bold text-lg hover:border-gray-300">Back to products</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Checkout;
