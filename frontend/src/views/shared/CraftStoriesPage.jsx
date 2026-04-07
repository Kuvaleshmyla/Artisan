import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, ImageIcon } from 'lucide-react';

const CraftStoriesPage = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        axios
            .get('/api/content/craft-stories')
            .then(({ data }) => {
                if (!cancelled) {
                    const list = Array.isArray(data) ? data : [];
                    setStories(list.map((s) => ({ ...s, images: Array.isArray(s.images) ? s.images : [] })));
                }
            })
            .catch(() => {
                if (!cancelled) setStories([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-24 text-brand-600">
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Craft stories</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                    Heritage, techniques, and maker voices — with photos that show how each craft comes to life.
                </p>
            </div>
            {stories.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Stories will appear here soon.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {stories.map((s) => {
                        const imgs = s.images || [];
                        const [main, ...rest] = imgs;

                        return (
                            <article
                                key={s._id}
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row h-full min-h-0"
                            >
                                <div className="md:w-[44%] shrink-0 bg-gray-100 dark:bg-gray-800/80 flex flex-col min-h-0">
                                    {main ? (
                                        <>
                                            <div className="w-full overflow-hidden">
                                                <img
                                                    src={main}
                                                    alt=""
                                                    className="w-full h-48 sm:h-52 md:h-56 lg:h-64 object-cover block"
                                                    loading="lazy"
                                                />
                                            </div>
                                            {rest.length > 0 ? (
                                                <div className="grid grid-cols-4 gap-1 p-2 border-t border-gray-200/80 dark:border-gray-700/80">
                                                    {rest.map((src, i) => (
                                                        <div
                                                            key={`${src}-${i}`}
                                                            className="aspect-square rounded-lg overflow-hidden ring-1 ring-black/5 dark:ring-white/10 bg-gray-200 dark:bg-gray-900"
                                                        >
                                                            <img
                                                                src={src}
                                                                alt=""
                                                                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <div className="flex flex-1 min-h-[200px] md:min-h-[220px] flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500 p-6">
                                            <ImageIcon size={40} strokeWidth={1.25} />
                                            <span className="text-xs font-medium text-center">Photos coming soon</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 p-6 flex flex-col min-w-0">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                                        {s.title}
                                    </h2>
                                    <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed text-sm flex-1">
                                        {s.body || (
                                            <span className="text-gray-400 dark:text-gray-500 italic">
                                                No description yet.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CraftStoriesPage;
