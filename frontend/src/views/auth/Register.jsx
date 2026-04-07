import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import ThemeToggle from '../../components/layout/ThemeToggle';

const inputClass =
    'w-full p-3.5 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all placeholder-gray-400 text-gray-900 dark:text-gray-100';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState('customer');
    const [businessName, setBusinessName] = useState('');
    const [description, setDescription] = useState('');
    const [craftType, setCraftType] = useState('');
    const [region, setRegion] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('India');
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [workVideoFile, setWorkVideoFile] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const workVideoInputRef = useRef(null);
    
    const navigate = useNavigate();
    const { register, userInfo } = useAuthStore();
    const dark = useThemeStore((s) => s.dark);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', Boolean(dark));
    }, [dark]);

    useEffect(() => {
        if (userInfo) {
            navigate('/dashboard');
        }
    }, [navigate, userInfo]);

    useEffect(() => {
        if (role !== 'artisan') {
            setWorkVideoFile(null);
            setGalleryFiles([]);
            if (workVideoInputRef.current) workVideoInputRef.current.value = '';
        }
    }, [role]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }
        try {
            if (role === 'artisan') {
                if (galleryFiles.length < 2) {
                    setErrorMsg('Please upload at least two workshop or portfolio images (JPEG, PNG, or WebP).');
                    return;
                }
                if (!workVideoFile) {
                    setErrorMsg('Please upload one video of your craft or workshop (MP4, WebM, or MOV).');
                    return;
                }
                const fd = new FormData();
                fd.append('name', name);
                fd.append('email', email);
                fd.append('password', password);
                fd.append('role', 'artisan');
                fd.append('businessName', businessName);
                fd.append('description', description);
                fd.append('craftType', craftType);
                fd.append('region', region);
                fd.append('state', state);
                fd.append('country', country);
                galleryFiles.forEach((file) => fd.append('gallery', file));
                fd.append('workVideo', workVideoFile);
                await register(fd);
            } else {
                await register({ name, email, password, role: 'customer' });
            }
            navigate('/dashboard');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen py-10 flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 md:px-0 relative">
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 dark:border-gray-800">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">Join Us</h2>
                    <p className="text-gray-500 dark:text-gray-400">Create your account</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6 border border-red-100 dark:border-red-900/60">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={submitHandler} className="space-y-4">
                    <div>
                        <label className={labelClass}>Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all placeholder-gray-400 text-gray-900 dark:text-gray-100"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all placeholder-gray-400 text-gray-900 dark:text-gray-100"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                className={inputClass}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700/80 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={20} strokeWidth={1.75} /> : <Eye size={20} strokeWidth={1.75} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Confirm password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                className={inputClass}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700/80 transition-colors"
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                                {showConfirmPassword ? <EyeOff size={20} strokeWidth={1.75} /> : <Eye size={20} strokeWidth={1.75} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I want to...</label>
                        <div className="flex gap-6 relative z-10">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="customer"
                                    checked={role === 'customer'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 relative z-20"
                                    style={{position: 'relative', zIndex: 10}} // fixes react radio button tailwind bug
                                />
                                <span>Buy Products</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="artisan"
                                    checked={role === 'artisan'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 relative z-20"
                                />
                                <span>Sell as Artisan</span>
                            </label>
                        </div>
                    </div>

                    {role === 'artisan' && (
                        <div className="space-y-4 pt-4 mt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Business / Shop Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Description</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    placeholder="Tell buyers about your craft..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Craft Type</label>
                                    <input
                                        type="text"
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                        placeholder="e.g., Pottery, Weaving, Woodwork"
                                        value={craftType}
                                        onChange={(e) => setCraftType(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
                                    <input
                                        type="text"
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                        placeholder="e.g., Rajasthan"
                                        value={region}
                                        onChange={(e) => setRegion(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                                    <input
                                        type="text"
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                        placeholder="e.g., Gujarat"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                                    <input
                                        type="text"
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Workshop photos (required — at least 2)
                                </label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/jpg"
                                    multiple
                                    className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-900/40 dark:file:text-brand-300"
                                    onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    JPEG, PNG, or WebP. Shown on your public artisan profile.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Craft / workshop video (required)
                                </label>
                                <input
                                    ref={workVideoInputRef}
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime,.mov"
                                    className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-900/40 dark:file:text-brand-300"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] || null;
                                        setWorkVideoFile(f);
                                    }}
                                />
                                {workVideoFile ? (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                        Selected: <span className="font-medium">{workVideoFile.name}</span>{' '}
                                        <button
                                            type="button"
                                            className="text-brand-600 font-semibold hover:underline ml-2"
                                            onClick={() => {
                                                setWorkVideoFile(null);
                                                if (workVideoInputRef.current) workVideoInputRef.current.value = '';
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        One short clip showing your process or workspace (MP4, WebM, or MOV). Shown on
                                        your public profile.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 mt-2 rounded-xl transition-all shadow-lg shadow-brand-200"
                    >
                        Create Account
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
