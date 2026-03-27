import { Link } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import Badge from './Badge';
import { addToWishlist, removeFromWishlist } from '../services/wishlist.service';
import toast from 'react-hot-toast';
import { normalizeImageUrl } from '../utils/image';
import OptimizedImage from './OptimizedImage';
import { trackEvent } from '../services/analytics.service';
import { decrementQuantity, formatQuantity, getUnitLabel, incrementQuantity } from '../utils/productUnits';

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
    const primaryImage = normalizeImageUrl(product.images && product.images.length > 0 ? product.images[0] : product.image_url);
    const productUnitLabel = getUnitLabel(product.unit);

    const trackAddToCart = () => {
        trackEvent('add_to_cart', {
            product_id: product.id,
            page: typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/product/${product.id}`,
        });
    };

    const handleIncrement = () => {
        if (quantity > 0) {
            updateQuantity(product.id, incrementQuantity(product, quantity));
        } else {
            addToCart(product);
        }
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
        <div className="mobile-app-card group flex h-full flex-col overflow-hidden rounded-[1.35rem]">
            <Link to={`/product/${product.id}`} className="relative block">
                <div className="relative aspect-square overflow-hidden bg-[#f3f8ee]">
                    <OptimizedImage
                        src={primaryImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        width={320}
                        height={320}
                        aspectRatio="1 / 1"
                        sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                    />

                    <button type="button" onClick={(e) => { e.preventDefault(); handleWishlistToggle(); }} className={`safe-touch absolute left-2 top-2 inline-flex h-9 min-h-0 w-9 min-w-0 items-center justify-center rounded-2xl border shadow-sm backdrop-blur ${isWishlisted ? 'border-rose-500 bg-rose-500 text-white' : 'border-white/80 bg-white/90 text-slate-500'}`} title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
                    </button>

                    {product.stock !== undefined && product.stock < 10 && (
                        <div className="absolute right-2 top-2">
                            <Badge variant={product.stock === 0 ? 'error' : 'warning'} size="sm">
                                {product.stock === 0 ? 'Sold out' : `${product.stock} left`}
                            </Badge>
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col gap-2.5 p-3">
                {product.category_name && (
                    <span className="max-w-full self-start rounded-full bg-[#eef7e6] px-2.5 py-1 text-[0.68rem] font-semibold text-green-700 whitespace-nowrap">
                        {product.category_name}
                    </span>
                )}

                <Link to={`/product/${product.id}`} className="block h-[2.7rem] overflow-hidden">
                    <h3 className="line-clamp-2 text-[0.94rem] font-semibold leading-[1.35] text-slate-900 [word-break:normal]" title={product.name}>{product.name}</h3>
                </Link>

                <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        {product.discountPrice ? (
                            <div className="flex flex-col">
                                <span className="text-[0.72rem] leading-none text-slate-400 line-through">Rs. {product.price}</span>
                                <span className="mt-1 text-[1rem] font-bold leading-none text-green-700">Rs. {product.discountPrice}</span>
                            </div>
                        ) : (
                            <span className="text-[1rem] font-bold leading-none text-slate-900">Rs. {product.pricePerUnit ?? product.price}</span>
                        )}
                        <p className="mt-1 text-[0.72rem] leading-none text-slate-500">per {productUnitLabel}</p>
                    </div>

                    {quantity > 0 ? (
                        <div className="flex items-center rounded-full border border-green-200 bg-green-50 p-1">
                            <button type="button" onClick={handleDecrement} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-green-700 transition hover:bg-green-600 hover:text-white"><Minus className="h-4 w-4" /></button>
                            <span className="min-w-[3.5rem] px-1 text-center text-sm font-bold text-green-800">{formatQuantity(product, quantity)}</span>
                            <button type="button" onClick={handleIncrement} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-green-700 transition hover:bg-green-600 hover:text-white"><Plus className="h-4 w-4" /></button>
                        </div>
                    ) : (
                        <button type="button" onClick={handleIncrement} className="inline-flex h-9 items-center justify-center rounded-full bg-green-600 px-3 text-white shadow-[0_10px_22px_rgba(34,197,94,0.25)] transition hover:bg-green-700" title="Add to cart"><ShoppingCart className="h-4 w-4" /></button>
                    )}
                </div>

                <button type="button" onClick={handleIncrement} className="mt-auto inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-[0.95rem] bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    <ShoppingCart className="h-4 w-4" />
                    {quantity > 0 ? 'Add step' : 'Add to cart'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
