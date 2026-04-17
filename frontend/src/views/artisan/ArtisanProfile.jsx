import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { User, Briefcase, FileText, Mail, Trash2, Video } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ArtisanProfile = () => {
    const { userInfo } = useAuthStore();
    const [profile, setProfile] = useState({
        businessName: '',
        description: '',
        workExperience: '',
        craftType: '',
        region: '',
        state: '',
        country: 'India',
        galleryImages: [],
        workVideo: '',
    });
    const [account, setAccount] = useState({ name: '', email: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [videoUploading, setVideoUploading] = useState(false);
    const workVideoInputRef = useRef(null);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/artisans/profile`, { withCredentials: true })
             .then(({data}) => {
                 setProfile({
                     businessName: data.businessName || '',
                     description: data.description || '',
                     workExperience: data.workExperience || '',
                     craftType: data.craftType || '',
                     region: data.region || '',
                     state: data.state || '',
                     country: data.country || 'India',
                     galleryImages: data.galleryImages || [],
                     workVideo: data.workVideo || '',
                 });
                 setAccount({
                     name: data.userId?.name || '',
                     email: data.userId?.email || ''
                 });
             })
             .catch(err => console.error(err));
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await axios.put(`${API_BASE_URL}/api/artisans/profile`, {
                businessName: profile.businessName,
                description: profile.description,
                workExperience: profile.workExperience,
                craftType: profile.craftType,
                region: profile.region,
                state: profile.state,
                country: profile.country,
                galleryImages: profile.galleryImages || [],
                workVideo: profile.workVideo || '',
            }, { withCredentials: true });
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile', error);
        } finally {
            setIsSaving(false);
        }
    };

    const displayEmail = account.email || userInfo?.email;
    const displayName = account.name || userInfo?.name;

    const addGalleryFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;
        setGalleryUploading(true);
        try {
            const urls = [];
            for (const file of files) {
                const fd = new FormData();
                fd.append('image', file);
                const { data } = await axios.post(`${API_BASE_URL}/api/upload`, fd, { withCredentials: true });
                urls.push(typeof data === 'string' ? data : String(data));
            }
            const next = [...(profile.galleryImages || []), ...urls];
            setProfile({ ...profile, galleryImages: next });
            await axios.put(`${API_BASE_URL}/api/artisans/profile`, { galleryImages: next }, { withCredentials: true });
        } catch (err) {
            console.error(err);
            alert('Could not upload images.');
        } finally {
            setGalleryUploading(false);
        }
    };

    const removeGalleryUrl = async (url) => {
        try {
            await axios.put(`${API_BASE_URL}/api/artisans/profile`, { removeGalleryImage: url }, { withCredentials: true });
            setProfile({
                ...profile,
                galleryImages: (profile.galleryImages || []).filter((u) => u !== url),
            });
        } catch (err) {
            console.error(err);
            alert('Could not remove image.');
        }
    };

    const uploadWorkVideo = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setVideoUploading(true);
        try {
            const fd = new FormData();
            fd.append('workVideo', file);
            const { data } = await axios.post(`${API_BASE_URL}/api/upload/work-video`, fd, {
                withCredentials: true,
                responseType: 'text',
            });
            const url = (typeof data === 'string' ? data : String(data)).trim();
            if (!url.startsWith('/')) {
                throw new Error('Invalid upload response');
            }
            setProfile({ ...profile, workVideo: url });
            await axios.put(`${API_BASE_URL}/api/artisans/profile`, { workVideo: url }, { withCredentials: true });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || err.message || 'Could not upload video.');
        } finally {
            setVideoUploading(false);
        }
    };

    const removeWorkVideo = async () => {
        if (!window.confirm('Remove your workshop video? You can upload a new one anytime.')) return;
        try {
            await axios.put(`${API_BASE_URL}/api/artisans/profile`, { removeWorkVideo: true }, { withCredentials: true });
            setProfile({ ...profile, workVideo: '' });
            if (workVideoInputRef.current) workVideoInputRef.current.value = '';
        } catch (err) {
            console.error(err);
            alert('Could not remove video.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                    <User size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">My artisan profile</h1>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-bold text-gray-900">{displayName || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 sm:ml-auto">
                        <Mail size={18} className="text-gray-400" />
                        <span className="text-sm">{displayEmail || '—'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={submitHandler} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Briefcase size={16} className="text-gray-400" /> Business / workshop name
                        </label>
                        <input type="text" required value={profile.businessName} onChange={e => setProfile({...profile, businessName: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" /> Short description
                        </label>
                        <textarea rows="3" required value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Craft type</label>
                            <input
                                type="text"
                                value={profile.craftType}
                                onChange={(e) => setProfile({ ...profile, craftType: e.target.value })}
                                placeholder="e.g., Pottery, Weaving"
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                            <input
                                type="text"
                                value={profile.region}
                                onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                                placeholder="e.g., Rajasthan"
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                                type="text"
                                value={profile.state}
                                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                                placeholder="e.g., Gujarat"
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                                type="text"
                                value={profile.country}
                                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                placeholder="India"
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Video size={16} className="text-gray-400" /> Workshop video
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Shown only to you and platform admins on your storefront page — not to customers. Replace or
                            remove anytime.
                        </p>
                        <input
                            ref={workVideoInputRef}
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,.mov"
                            disabled={videoUploading}
                            className="sr-only"
                            tabIndex={-1}
                            onChange={uploadWorkVideo}
                        />
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                disabled={videoUploading}
                                onClick={() => workVideoInputRef.current?.click()}
                                className="text-sm font-bold text-brand-600 hover:underline disabled:opacity-50"
                            >
                                {videoUploading ? 'Uploading…' : profile.workVideo ? 'Replace video' : 'Upload video'}
                            </button>
                            {profile.workVideo ? (
                                <button
                                    type="button"
                                    onClick={removeWorkVideo}
                                    className="text-sm font-bold text-red-600 hover:underline"
                                >
                                    Remove video
                                </button>
                            ) : null}
                        </div>
                        {profile.workVideo ? (
                            <div className="rounded-xl overflow-hidden border border-gray-200 bg-black max-w-lg mt-4">
                                <video
                                    src={profile.workVideo}
                                    controls
                                    playsInline
                                    className="w-full max-h-64 object-contain bg-black"
                                >
                                    Your browser does not support video.
                                </video>
                            </div>
                        ) : null}
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Workshop photos</label>
                        <p className="text-xs text-gray-500 mb-3">
                            Shown only to you and platform admins on your storefront — not to customers. Add or remove
                            anytime.
                        </p>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            multiple
                            disabled={galleryUploading}
                            onChange={addGalleryFiles}
                            className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-50 file:text-brand-700"
                        />
                        {galleryUploading && <p className="text-xs text-brand-600 mt-2">Uploading…</p>}
                        {(profile.galleryImages || []).length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4">
                                {(profile.galleryImages || []).map((url) => (
                                    <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryUrl(url)}
                                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove image"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work experience & portfolio</label>
                        <p className="text-xs text-gray-500 mb-3 leading-relaxed max-w-xl">Craft background, materials, and exhibitions.</p>
                        <textarea rows="6" value={profile.workExperience} onChange={e => setProfile({...profile, workExperience: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Describe your craft journey…"></textarea>
                    </div>
                    
                    <div className="flex justify-end pt-8">
                        <button type="submit" disabled={isSaving} className="bg-brand-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">
                            {isSaving ? 'Saving…' : 'Update profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ArtisanProfile;
