import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { normalizeImageUrl } from '../utils/image';
import { calculateLineTotal, formatQuantity } from '../utils/productUnits';

type CartToastItem = {
    id: number;
    name: string;
    quantity: number;
    image_url?: string;
    images?: string[];
    unit?: string;
    price?: number;
    discountPrice?: number;
    pricePerUnit?: number;
    minQty?: number;
    stepQty?: number;
};

type CartSummaryToastProps = {
    items: CartToastItem[];
    toastId: string;
};

const CartSummaryToast = ({ items, toastId }: CartSummaryToastProps) => {
    const totalAmount = items.reduce((sum, item) => sum + calculateLineTotal(item, item.quantity), 0);
    const dismissTimerRef = useRef<number | null>(null);
    const scrollerRef = useRef<HTMLDivElement | null>(null);

    const clearDismissTimer = useCallback(() => {
        if (dismissTimerRef.current) {
            window.clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = null;
        }
    }, []);

    const scheduleDismiss = useCallback((delayMs: number) => {
        clearDismissTimer();
        dismissTimerRef.current = window.setTimeout(() => {
            toast.dismiss(toastId);
        }, delayMs);
    }, [clearDismissTimer, toastId]);

    useEffect(() => {
        scheduleDismiss(500);
        return clearDismissTimer;
    }, [clearDismissTimer, scheduleDismiss]);

    useEffect(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'auto' });
    }, [items]);

    return (
        <div
            className="pointer-events-auto relative w-[min(92vw,22rem)] overflow-visible"
            onMouseEnter={clearDismissTimer}
            onMouseLeave={() => scheduleDismiss(5000)}
            onTouchStart={clearDismissTimer}
            onTouchEnd={() => scheduleDismiss(5000)}
            onClick={() => scheduleDismiss(5000)}
        >
            <div className="absolute top-2 right-6 h-3 w-3 rotate-45 rounded-[0.2rem] border-l border-t border-slate-800 bg-slate-900" />
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-[0_18px_36px_rgba(15,23,42,0.3)]">
            <div className="border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold">Cart updated</p>
                <p className="mt-0.5 text-xs text-white/70">{items.length} items</p>
            </div>

            <div ref={scrollerRef} className="max-h-64 space-y-3 overflow-y-auto px-4 py-3">
                {items.map((item) => {
                    const image = item.images && item.images.length > 0 ? item.images[0] : item.image_url;
                    return (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className="h-11 w-11 overflow-hidden rounded-xl bg-white/10">
                                <img src={normalizeImageUrl(image)} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{item.name}</p>
                                <p className="mt-0.5 text-xs text-white/70">{formatQuantity(item, item.quantity)}</p>
                            </div>
                            <p className="text-sm font-semibold">Rs. {calculateLineTotal(item, item.quantity).toFixed(0)}</p>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                <span className="text-sm text-white/75">Total</span>
                <span className="text-base font-bold">Rs. {totalAmount.toFixed(0)}</span>
            </div>
            </div>
        </div>
    );
};

export default CartSummaryToast;
