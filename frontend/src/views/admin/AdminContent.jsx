import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, ImagePlus, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const emptyDraft = () => ({ title: '', body: '', sortOrder: 0, images: [] });

function parseUploadPath(data) {
    const raw = (typeof data === 'string' ? data : String(data ?? '')).trim();
    const path = raw.replace(/^["']|["']$/g, '');
    if (!path.startsWith('/')) return null;
    return path;
}

async function uploadFilesToUrls(files) {
    const urls = [];
    for (const file of Array.from(files || [])) {
        const fd = new FormData();
        fd.append('image', file);
        const { data } = await axios.post(`${API_BASE_URL}/api/upload`, fd, {
            withCredentials: true,
            responseType: 'text',
        });
        const path = parseUploadPath(data);
        if (!path) {
            throw new Error('Upload did not return a valid file path.');
        }
        urls.push(path);
    }
    return urls;
}

const AdminContent = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState(() => emptyDraft());
    const draftFileInputRef = useRef(null);
    const [savingId, setSavingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [uploadingDraft, setUploadingDraft] = useState(false);
    const [uploadingStoryId, setUploadingStoryId] = useState(null);

    const load = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/content/craft-stories`);
            const list = Array.isArray(data) ? data : [];
            setStories(list.map((x) => ({ ...x, images: Array.isArray(x.images) ? x.images : [] })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const createStory = async (e) => {
        e.preventDefault();
        if (!draft.title.trim()) return;
        try {
            setCreating(true);
            await axios.post(`${API_BASE_URL}/api/content/craft-stories`, draft, { withCredentials: true });
            setDraft(emptyDraft());
            await load();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not create story');
        } finally {
            setCreating(false);
        }
    };

    const saveStory = async (s) => {
        try {
            setSavingId(s._id);
            await axios.put(`${API_BASE_URL}/api/content/craft-stories/${s._id}`, s, { withCredentials: true });
            await load();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not save');
        } finally {
            setSavingId(null);
        }
    };

    const deleteStory = async (id) => {
        if (!window.confirm('Delete this craft story?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/content/craft-stories/${id}`, { withCredentials: true });
            await load();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not delete');
        }
    };

    const updateLocal = (id, patch) => {
        setStories((prev) => prev.map((x) => (x._id === id ? { ...x, ...patch } : x)));
    };

    if (loading) {
        return <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading craft stories…</div>;
    }

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Craft stories</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Add multiple stories; they appear on the public Craft stories page for customers and artisans.
                </p>
            </div>

            <form
                onSubmit={createStory}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4"
            >
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">New story</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={draft.title}
                            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100"
                            placeholder="Story title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort order</label>
                        <input
                            type="number"
                            value={draft.sortOrder}
                            onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
                    <textarea
                        rows={5}
                        value={draft.body}
                        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div>
                    <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Craft photos (optional — show how the craft looks)
                    </p>
                    <input
                        ref={draftFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        multiple
                        disabled={uploadingDraft}
                        className="sr-only"
                        tabIndex={-1}
                        onChange={async (e) => {
                            const files = e.target.files;
                            if (!files?.length) return;
                            try {
                                setUploadingDraft(true);
                                const urls = await uploadFilesToUrls(files);
                                setDraft((d) => ({
                                    ...d,
                                    images: [...(Array.isArray(d.images) ? d.images : []), ...urls],
                                }));
                            } catch (err) {
                                const msg =
                                    err.response?.data?.message ||
                                    err.message ||
                                    (typeof err.response?.data === 'string' ? err.response.data : null) ||
                                    'Upload failed';
                                alert(msg);
                            } finally {
                                setUploadingDraft(false);
                                e.target.value = '';
                            }
                        }}
                    />
                    <button
                        type="button"
                        disabled={uploadingDraft}
                        onClick={() => draftFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                    >
                        <ImagePlus size={18} />
                        <span>{uploadingDraft ? 'Uploading…' : 'Upload images'}</span>
                    </button>
                    {Array.isArray(draft.images) && draft.images.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {draft.images.map((url, i) => (
                                <div
                                    key={`${url}-${i}`}
                                    className="relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                >
                                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDraft((d) => ({
                                                ...d,
                                                images: (Array.isArray(d.images) ? d.images : []).filter(
                                                    (_, j) => j !== i
                                                ),
                                            }))
                                        }
                                        className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Remove image"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
                <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50"
                >
                    <Plus size={18} /> {creating ? 'Adding…' : 'Add story'}
                </button>
            </form>

            <div className="space-y-4">
                {stories.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No stories yet. Add one above.</p>
                ) : (
                    stories.map((s) => (
                        <div
                            key={s._id}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="font-bold text-gray-800 dark:text-gray-100">Edit story</h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => saveStory(s)}
                                        disabled={savingId === s._id}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-gray-900 dark:bg-brand-700 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                                    >
                                        <Save size={14} /> {savingId === s._id ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteStory(s._id)}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 border border-red-200 dark:border-red-900 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={s.title}
                                        onChange={(e) => updateLocal(s._id, { title: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sort</label>
                                    <input
                                        type="number"
                                        value={s.sortOrder ?? 0}
                                        onChange={(e) => updateLocal(s._id, { sortOrder: Number(e.target.value) || 0 })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Body</label>
                                <textarea
                                    rows={6}
                                    value={s.body || ''}
                                    onChange={(e) => updateLocal(s._id, { body: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <p className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Craft photos
                                </p>
                                <input
                                    id={`craft-story-upload-${s._id}`}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/jpg"
                                    multiple
                                    disabled={uploadingStoryId === s._id}
                                    className="sr-only"
                                    tabIndex={-1}
                                    onChange={async (e) => {
                                        const files = e.target.files;
                                        if (!files?.length) return;
                                        try {
                                            setUploadingStoryId(s._id);
                                            const urls = await uploadFilesToUrls(files);
                                            const cur = Array.isArray(s.images) ? s.images : [];
                                            updateLocal(s._id, { images: [...cur, ...urls] });
                                        } catch (err) {
                                            const msg =
                                                err.response?.data?.message ||
                                                err.message ||
                                                (typeof err.response?.data === 'string'
                                                    ? err.response.data
                                                    : null) ||
                                                'Upload failed';
                                            alert(msg);
                                        } finally {
                                            setUploadingStoryId(null);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    disabled={uploadingStoryId === s._id}
                                    onClick={() =>
                                        document.getElementById(`craft-story-upload-${s._id}`)?.click()
                                    }
                                    className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                                >
                                    <ImagePlus size={16} />
                                    <span>
                                        {uploadingStoryId === s._id ? 'Uploading…' : 'Add images'}
                                    </span>
                                </button>
                                {(Array.isArray(s.images) ? s.images : []).length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {(Array.isArray(s.images) ? s.images : []).map((url, i) => (
                                            <div
                                                key={`${url}-${i}`}
                                                className="relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                            >
                                                <img
                                                    src={url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateLocal(s._id, {
                                                            images: (Array.isArray(s.images) ? s.images : []).filter(
                                                                (_, j) => j !== i
                                                            ),
                                                        })
                                                    }
                                                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-label="Remove image"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 mt-2">No photos yet.</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminContent;
