import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import Badge from './Badge';
import { addToWishlist, removeFromWishlist } from '../services/wishlist.service';
import toast from 'react-hot-toast';
import { normalizeImageUrl } from '../utils/image';
import { trackEvent } from '../services/analytics.service';
import { decrementQuantity, formatQuantity, getInitialQuantity, getMinimumQuantityPrice, getOriginalMinimumQuantityPrice, incrementQuantity } from '../utils/productUnits';
import CartSummaryToast from './CartSummaryToast';

const slideshowVariants = {
    enter: (direction: 1 | -1) => ({
        x: direction === 1 ? '100%' : '-100%',
        opacity: 0.98,
    }),
    center: {
        x: '0%',
        opacity: 1,
    },
    exit: (direction: 1 | -1) => ({
        x: direction === 1 ? '-100%' : '100%',
        opacity: 0.98,
    }),
};

interface Product {
    id: number;
    name: string;
    price: number;
    discountPrice?: number;
    pricePerUnit?: number;
    unit?: string;
    minQty?: number;
    stepQty?: number;
    image_url: string;
    images?: string[];
    category_name?: string;
    category_tags?: Array<{ id: number; name: string; slug: string }>;
    stock?: number;
}

interface ProductCardProps {
    product: Product;
    onWishlistChange?: (productId: number, isWishlisted: boolean) => void;
}

const ProductCard = ({ product, onWishlistChange }: ProductCardProps) => {
    const { cart, user, wishlistIds, addToCart, removeFromCart, updateQuantity, addWishlistItem, removeWishlistItem } = useStore((state) => ({
        cart: state.cart,
        user: state.user,
        wishlistIds: state.wishlistIds,
        addToCart: state.addToCart,
        removeFromCart: state.removeFromCart,
        updateQuantity: state.updateQuantity,
        addWishlistItem: state.addWishlistItem,
        removeWishlistItem: state.removeWishlistItem,
    }));

    const cartItem = cart.find((item) => item.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    const isWishlisted = wishlistIds.includes(product.id);
    const productImages = useMemo(
        () => (product.images && product.images.length > 0 ? product.images : [product.image_url]).map((image) => normalizeImageUrl(image)),
        [product.image_url, product.images]
    );
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isImageHovered, setIsImageHovered] = useState(false);
    const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
    const [sequenceDirection, setSequenceDirection] = useState<1 | -1>(1);
    const minimumQuantity = getInitialQuantity(product);
    const minimumQuantityLabel = formatQuantity(product, minimumQuantity);
    const minimumQuantityPrice = getMinimumQuantityPrice(product);
    const originalMinimumQuantityPrice = getOriginalMinimumQuantityPrice(product);

    const rememberShopProduct = () => {
        if (typeof window === 'undefined') return;
        if (!window.location.pathname.startsWith('/shop')) return;
        sessionStorage.setItem('shop_last_product_id', String(product.id));
    };

    useEffect(() => {
        setActiveImageIndex(0);
        setSlideDirection(1);
        setSequenceDirection(1);
    }, [product.id]);

    useEffect(() => {
        if (productImages.length <= 1 || !isImageHovered) return;

        const intervalId = window.setInterval(() => {
            setActiveImageIndex((currentIndex) => {
                const atStart = currentIndex === 0;
                const atEnd = currentIndex === productImages.length - 1;

                setSequenceDirection((currentSequenceDirection) => {
                    let nextSequenceDirection = currentSequenceDirection;
                    if (atEnd) nextSequenceDirection = -1;
                    if (atStart) nextSequenceDirection = 1;

                    setSlideDirection(nextSequenceDirection);
                    return nextSequenceDirection;
                });

                if (atEnd) return currentIndex - 1;
                if (atStart) return currentIndex + 1;
                return currentIndex + sequenceDirection;
            });
        }, 1800);

        return () => window.clearInterval(intervalId);
    }, [isImageHovered, productImages, sequenceDirection]);

    const trackAddToCart = () => {
        trackEvent('add_to_cart', {
            product_id: product.id,
            page: typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/product/${product.id}`,
        });
    };

    const showCartToast = (nextQuantity: number) => {
        const nextCart = quantity > 0
            ? cart.map((item) => (item.id === product.id ? { ...item, quantity: nextQuantity } : item))
            : [...cart, { ...product, quantity: nextQuantity }];
        toast.custom(
            (t) => <div className={t.visible ? 'animate-enter' : 'animate-leave'}><CartSummaryToast items={nextCart} toastId="cart-summary" /></div>,
            { id: 'cart-summary', duration: 500, position: 'top-right' }
        );
    };

    const handleIncrement = () => {
        const nextQuantity = quantity > 0 ? incrementQuantity(product, quantity) : minimumQuantity;
        if (quantity > 0) {
            updateQuantity(product.id, nextQuantity);
        } else {
            addToCart(product);
        }
        showCartToast(nextQuantity);
        trackAddToCart();
    };

    const handleDecrement = () => {
        const nextQuantity = decrementQuantity(product, quantity);
        if (nextQuantity > 0) updateQuantity(product.id, nextQuantity);
        else removeFromCart(product.id);
    };

    const handleWishlistToggle = async () => {
        if (!user) {
            toast.error('Please login to use wishlist');
            return;
        }

        try {
            if (isWishlisted) {
                removeWishlistItem(product.id);
                await removeFromWishlist(product.id);
                onWishlistChange?.(product.id, false);
                toast.success('Removed from wishlist');
            } else {
                addWishlistItem(product.id);
                await addToWishlist(product.id);
                onWishlistChange?.(product.id, true);
                toast.success('Added to wishlist');
            }
        } catch (error: any) {
            if (isWishlisted) addWishlistItem(product.id);
            else removeWishlistItem(product.id);
            toast.error(error?.response?.data?.message || 'Unable to update wishlist');
        }
    };

    return (
        <div
            className="mobile-app-card group flex h-full flex-col overflow-hidden rounded-[1.35rem]"
            data-product-card-id={product.id}
        >
            <Link to={`/product/${product.id}`} className="relative block" onClick={rememberShopProduct}>
                <div
                    className="relative aspect-square overflow-hidden bg-[#f3f8ee]"
                    onMouseEnter={() => setIsImageHovered(true)}
                    onMouseLeave={() => {
                        setIsImageHovered(false);
                        setActiveImageIndex(0);
                        setSlideDirection(1);
                        setSequenceDirection(1);
                    }}
                >
                    <AnimatePresence mode="sync" initial={false} custom={slideDirection}>
                        <motion.img
                            key={`${product.id}-${activeImageIndex}`}
                            src={productImages[activeImageIndex]}
                            alt={product.name}
                            className="absolute inset-0 h-full w-full object-cover"
                            custom={slideDirection}
                            variants={slideshowVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </AnimatePresence>

                    {productImages.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900/45 px-2 py-1 backdrop-blur-sm">
                            {productImages.map((_, index) => (
                                <span
                                    key={`${product.id}-dot-${index}`}
                                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                                        index === activeImageIndex ? 'bg-white' : 'bg-white/45'
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    <button type="button" onClick={(e) => { e.preventDefault(); handleWishlistToggle(); }} className={`safe-touch absolute right-2 top-2 inline-flex h-9 min-h-0 w-9 min-w-0 items-center justify-center rounded-2xl border shadow-sm backdrop-blur ${isWishlisted ? 'border-rose-500 bg-rose-500 text-white' : 'border-white/80 bg-white/90 text-slate-500'}`} title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
                    </button>

                    {product.stock !== undefined && product.stock < 10 && (
                        <div className="absolute left-2 top-2">
                            <Badge variant={product.stock === 0 ? 'error' : 'warning'} size="sm">
                                {product.stock === 0 ? 'Sold out' : `${product.stock} left`}
                            </Badge>
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col gap-2.5 p-3">
                {product.category_tags && product.category_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-w-full">
                        {product.category_tags.slice(0, 3).map(tag => (
                            <span key={tag.id} className="rounded-full bg-[#eef7e6] px-2 py-0.5 text-[0.65rem] font-bold tracking-tight text-green-700 whitespace-nowrap border border-green-100 shadow-sm">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                ) : product.category_name && (
                    <span className="max-w-full self-start rounded-full bg-[#eef7e6] px-2.5 py-1 text-[0.68rem] font-semibold text-green-700 whitespace-nowrap">
                        {product.category_name}
                    </span>
                )}

                <Link to={`/product/${product.id}`} className="block h-[2.7rem] overflow-hidden" onClick={rememberShopProduct}>
                    <h3 className="line-clamp-2 text-[0.94rem] font-semibold leading-[1.35] text-slate-900 [word-break:normal]" title={product.name}>{product.name}</h3>
                </Link>

                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="min-w-0">
                        {product.discountPrice && originalMinimumQuantityPrice > minimumQuantityPrice ? (
                            <div className="flex flex-col items-start">
                                <span className="text-[0.72rem] leading-none text-slate-400 line-through">Rs. {originalMinimumQuantityPrice.toFixed(0)}</span>
                                <span className="mt-1 inline-block rounded-lg bg-violet-900 px-2 py-1 text-[1rem] font-bold leading-none text-white w-fit">Rs. {minimumQuantityPrice.toFixed(0)}</span>
                            </div>
                        ) : (
                            <span className="inline-block rounded-lg bg-violet-900 px-2 py-1 text-[1rem] font-bold leading-none text-white w-fit">Rs. {minimumQuantityPrice.toFixed(0)}</span>
                        )}
                        <p className="mt-1 text-[0.72rem] leading-none text-slate-500">{minimumQuantityLabel}</p>
                    </div>

                    {quantity > 0 ? (
                        <div className="flex items-center rounded-full border border-[#b7d8bf] bg-[#eff8f1] p-1">
                            <button type="button" onClick={handleDecrement} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#165c34] transition hover:bg-[#165c34] hover:text-white"><Minus className="h-4 w-4" /></button>
                            <span className="min-w-[3.5rem] px-1 text-center text-sm font-bold text-[#165c34]">{formatQuantity(product, quantity)}</span>
                            <button type="button" onClick={handleIncrement} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#165c34] transition hover:bg-[#165c34] hover:text-white"><Plus className="h-4 w-4" /></button>
                        </div>
                    ) : (
                        <button type="button" onClick={handleIncrement} className="inline-flex h-9 items-center justify-center rounded-full bg-[#165c34] px-3 text-white shadow-[0_10px_22px_rgba(22,92,52,0.28)] transition hover:bg-[#124728]" title="Add to cart"><Plus className="h-5 w-5" /></button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
