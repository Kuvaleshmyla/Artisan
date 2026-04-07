import { Clock, CheckCircle2, Package, Truck } from 'lucide-react';

/** Matches backend Order.status fulfillment flow */
export const FULFILLMENT_STEPS = [
    { key: 'pending', label: 'Pending', description: 'Awaiting artisan to verify payment', icon: Clock },
    { key: 'accepted', label: 'Accepted', description: 'Payment verified — preparing your order', icon: CheckCircle2 },
    { key: 'processing', label: 'Processing', description: 'Order is being prepared', icon: Package },
    { key: 'shipped', label: 'Shipped', description: 'On the way to you', icon: Truck },
    { key: 'delivered', label: 'Delivered', description: 'Delivered', icon: CheckCircle2 },
];

const STATUS_TO_INDEX = FULFILLMENT_STEPS.reduce((acc, s, i) => {
    acc[s.key] = i;
    return acc;
}, {});

export function getFulfillmentStepIndex(status) {
    const s = (status || 'pending').toLowerCase();
    if (s === 'cancelled') return -1;
    const i = STATUS_TO_INDEX[s];
    return typeof i === 'number' ? i : 0;
}

/**
 * Horizontal tracking: fill grows from 0% → 100% as status moves pending → delivered.
 */
export default function OrderTrackingBar({ status, className = '' }) {
    const cancelled = (status || '').toLowerCase() === 'cancelled';
    if (cancelled) {
        return (
            <div
                className={`rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm font-medium text-red-800 dark:text-red-200 ${className}`}
                role="status"
            >
                This order was cancelled — tracking is closed.
            </div>
        );
    }

    const currentIndex = getFulfillmentStepIndex(status);
    const last = FULFILLMENT_STEPS.length - 1;
    const trackFillPercent = last === 0 ? 0 : (currentIndex / last) * 100;

    return (
        <div className={className} role="group" aria-label="Order fulfillment progress">
            <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Order tracking</h4>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                    {FULFILLMENT_STEPS[currentIndex]?.label}
                </span>
            </div>

            <div className="relative px-1 sm:px-2 pt-1 pb-2">
                {/* Bar spans inner 80% of row; fill grows 0→100% of that segment as status advances */}
                <div
                    className="absolute left-[10%] top-[18px] h-1.5 w-[80%] bg-gray-200 dark:bg-gray-700 rounded-full"
                    aria-hidden
                />
                <div
                    className="absolute left-[10%] top-[18px] h-1.5 max-w-[80%] bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${(trackFillPercent / 100) * 80}%` }}
                    aria-hidden
                />

                <div className="relative flex justify-between items-start">
                    {FULFILLMENT_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const done = index < currentIndex;
                        const active = index === currentIndex;

                        return (
                            <div
                                key={step.key}
                                className="flex flex-col items-center w-0 flex-1 min-w-0"
                            >
                                <div
                                    className={`
                                        relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500
                                        ${
                                            done
                                                ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/25'
                                                : active
                                                  ? 'border-brand-500 bg-white dark:bg-gray-900 text-brand-600 ring-4 ring-brand-200/80 dark:ring-brand-900/50 scale-105'
                                                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400'
                                        }
                                    `}
                                >
                                    <Icon size={16} strokeWidth={active ? 2.5 : 2} aria-hidden />
                                </div>
                                <p
                                    className={`mt-2 text-center text-[10px] sm:text-xs font-bold leading-tight px-0.5 ${
                                        active
                                            ? 'text-brand-700 dark:text-brand-300'
                                            : done
                                              ? 'text-gray-700 dark:text-gray-300'
                                              : 'text-gray-400 dark:text-gray-500'
                                    }`}
                                >
                                    {step.label}
                                </p>
                                {active ? (
                                    <p className="mt-1 hidden sm:block text-center text-[10px] text-gray-500 dark:text-gray-400 max-w-[100px] leading-snug">
                                        {step.description}
                                    </p>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Accessible summary */}
            <p className="sr-only">
                Current step {currentIndex + 1} of {FULFILLMENT_STEPS.length}:{' '}
                {FULFILLMENT_STEPS[currentIndex]?.label}.{' '}
                {FULFILLMENT_STEPS[currentIndex]?.description}
            </p>
        </div>
    );
}
