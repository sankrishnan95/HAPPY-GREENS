import { Link } from 'react-router-dom';
import { Plus, Minus, Heart } from 'lucide-react';
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
        <div className="group flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08)]">
            <Link to={`/product/${product.id}`} className="relative block p-4 pb-0">
                <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#fdfdfd]">
                    <OptimizedImage
                        src={primaryImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        width={320}
                        height={320}
                        aspectRatio="1 / 1"
                        sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                    />

                    <button type="button" onClick={(e) => { e.preventDefault(); handleWishlistToggle(); }} className={`safe-touch absolute left-3 top-3 inline-flex h-9 min-h-0 w-9 min-w-0 items-center justify-center rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur transition-all duration-300 ${isWishlisted ? 'border-rose-500 bg-rose-500 text-white' : 'border-black/5 bg-white/90 text-gray-400 hover:text-black hover:bg-white'}`} title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                        <Heart className={`h-4 w-4 transition-transform duration-300 ${isWishlisted ? 'fill-white scale-110' : 'scale-100'}`} />
                    </button>

                    {product.stock !== undefined && product.stock < 10 && (
                        <div className="absolute right-3 top-3">
                            <Badge variant={product.stock === 0 ? 'error' : 'warning'} size="sm" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                {product.stock === 0 ? 'Sold out' : `${product.stock} left`}
                            </Badge>
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="min-w-0">
                    {product.category_name && (
                        <span className="mb-2 inline-block text-[0.7rem] font-bold uppercase tracking-widest text-gray-400">
                            {product.category_name}
                        </span>
                    )}
                    <Link to={`/product/${product.id}`} className="block">
                        <h3 className="line-clamp-2 text-[1.05rem] font-semibold leading-[1.3] tracking-tight text-black" title={product.name}>{product.name}</h3>
                    </Link>
                    <p className="mt-0.5 text-[0.8rem] text-gray-500">per {productUnitLabel}</p>
                </div>

                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <div className="flex flex-col flex-wrap">
                        {product.discountPrice ? (
                            <>
                                <span className="text-[0.75rem] font-semibold tracking-wide text-gray-400 line-through">Rs. {product.price}</span>
                                <span className="text-[1.15rem] font-semibold tracking-tight text-black">Rs. {product.discountPrice}</span>
                            </>
                        ) : (
                            <span className="text-[1.15rem] font-semibold tracking-tight text-black">Rs. {product.pricePerUnit ?? product.price}</span>
                        )}
                    </div>

                    {quantity > 0 ? (
                        <div className="flex h-10 items-center justify-between gap-3 rounded-full bg-green-50 px-1.5 min-w-[96px] border border-green-100">
                            <button type="button" onClick={handleDecrement} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-green-700 shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition hover:bg-green-600 hover:text-white"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="text-sm font-semibold text-green-800">{formatQuantity(product, quantity)}</span>
                            <button type="button" onClick={handleIncrement} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-green-700 shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition hover:bg-green-600 hover:text-white"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                    ) : (
                        <button type="button" onClick={handleIncrement} className="flex h-10 items-center justify-center gap-2 rounded-full bg-green-600 px-5 text-sm font-medium tracking-wide text-white shadow-md shadow-green-600/20 transition-all duration-300 hover:scale-105 hover:bg-green-700 focus:scale-95" title="Add to cart">
                            Add
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
