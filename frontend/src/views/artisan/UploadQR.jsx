import { useEffect, useState } from 'react';
import { Upload, CheckCircle2, Trash2 } from 'lucide-react';
import axios from 'axios';

const UploadQR = () => {
    const [profile, setProfile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const load = () => {
        axios
            .get('/api/artisans/profile', { withCredentials: true })
            .then(({ data }) => setProfile(data))
            .catch(console.error);
    };

    useEffect(() => {
        load();
    }, []);

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const { data: imageUrl } = await axios.post('/api/upload', formData, { withCredentials: true });
            await axios.put('/api/artisans/profile', { qrCodeImage: imageUrl }, { withCredentials: true });
            load();
        } catch (err) {
            console.error(err);
            alert('Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const selectQr = async (url) => {
        try {
            await axios.put('/api/artisans/profile', { qrCodeImage: url }, { withCredentials: true });
            load();
        } catch (e) {
            alert('Could not set active QR.');
        }
    };

    const removeQr = async (e, url) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Remove this QR image from your account?')) return;
        try {
            await axios.put('/api/artisans/profile', { removeQrImage: url }, { withCredentials: true });
            load();
        } catch (err) {
            alert('Could not delete QR image.');
        }
    };

    const images = profile?.qrCodeImages?.length ? profile.qrCodeImages : profile?.qrCodeImage ? [profile.qrCodeImage] : [];

    return (
        <div className="max-w-2xl mx-auto space-y-6 mt-4 pb-20">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-4 shadow-sm border border-brand-100">
                        <Upload size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment QR codes</h2>
                    <p className="text-gray-500 px-4">Upload UPI or bank QR images. Select which one customers should see at checkout.</p>
                </div>

                <label className="cursor-pointer flex flex-col items-center justify-center w-full border-2 border-dashed border-brand-200 rounded-2xl py-10 bg-brand-50/40 hover:bg-brand-50 transition-colors">
                    {uploading ? (
                        <p className="text-brand-600 font-medium">Uploading…</p>
                    ) : (
                        <>
                            <Upload className="text-brand-500 mb-2" size={28} />
                            <p className="text-gray-700 font-semibold">Upload a new QR image</p>
                            <p className="text-xs text-gray-500 mt-2">JPG or PNG</p>
                        </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={onFile} disabled={uploading} />
                </label>

                {profile?.qrCodeImage && (
                    <div className="mt-10">
                        <p className="text-sm font-bold text-gray-700 mb-3">Currently active at checkout</p>
                        <div className="inline-block border-4 border-brand-200 rounded-2xl p-4 bg-white">
                            <img src={profile.qrCodeImage} alt="Active QR" className="max-w-xs w-full object-contain" />
                        </div>
                    </div>
                )}

                {images.length > 0 && (
                    <div className="mt-10 border-t border-gray-100 pt-8">
                        <p className="text-sm font-bold text-gray-700 mb-4">Uploaded QR images — select active</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {images.map((url) => (
                                <div
                                    key={url}
                                    className={`relative rounded-xl border-2 overflow-hidden text-left ${
                                        profile?.qrCodeImage === url ? 'border-brand-600 ring-2 ring-brand-200' : 'border-gray-200 hover:border-brand-300'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => selectQr(url)}
                                        className="block w-full text-left"
                                    >
                                        <img src={url} alt="" className="w-full h-32 object-contain bg-gray-50" />
                                        {profile?.qrCodeImage === url && (
                                            <span className="absolute top-2 right-10 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Active
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => removeQr(e, url)}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm"
                                        aria-label="Delete QR"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadQR;
