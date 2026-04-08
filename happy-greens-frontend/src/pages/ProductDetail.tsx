import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Minus, Plus, ShoppingCart, ArrowLeft, ChevronRight, Heart } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { API_BASE_URL } from '../config/api';
import { normalizeImageUrl } from '../utils/image';
import { addToWishlist, removeFromWishlist } from '../services/wishlist.service';
import toast from 'react-hot-toast';
import { trackEvent } from '../services/analytics.service';
import { decrementQuantity, formatQuantity, getMinimumQuantityPrice, getOriginalMinimumQuantityPrice, getQuantityRules, incrementQuantity } from '../utils/productUnits';
import CartSummaryToast from '../components/CartSummaryToast';

const FALLBACK_PRODUCT_IMAGE = normalizeImageUrl(null);

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const { cart, user, wishlistIds, addToCart, updateQuantity, removeFromCart, addWishlistItem, removeWishlistItem } = useStore((state) => ({
        cart: state.cart,
        user: state.user,
        wishlistIds: state.wishlistIds,
        addToCart: state.addToCart,
        updateQuantity: state.updateQuantity,
        removeFromCart: state.removeFromCart,
        addWishlistItem: state.addWishlistItem,
        removeWishlistItem: state.removeWishlistItem,
    }));

    const cartItem = cart.find((item) => item.id === Number(id));
    const quantity = cartItem ? cartItem.quantity : 0;
    const isWishlisted = product ? wishlistIds.includes(product.id) : false;

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
                setProduct(res.data);
                trackEvent('product_view', {
                    product_id: Number(id),
                    page: `/product/${id}`,
                });
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const showCartToast = (nextQuantity: number) => {
        if (!product) return;
        const nextCart = quantity > 0
            ? cart.map((item) => (item.id === product.id ? { ...item, quantity: nextQuantity } : item))
            : [...cart, { ...product, quantity: nextQuantity }];
        toast.custom(
            (t) => <div className={t.visible ? 'animate-enter' : 'animate-leave'}><CartSummaryToast items={nextCart} /></div>,
            { id: `cart-${product.id}`, duration: 1800, position: 'top-right' }
        );
    };

    const handleIncrement = () => {
        const nextQuantity = quantity > 0 ? incrementQuantity(product, quantity) : minQty;
        if (quantity > 0) {
            updateQuantity(Number(id), nextQuantity);
        } else {
            addToCart(product);
        }
        showCartToast(nextQuantity);
        trackEvent('add_to_cart', {
            product_id: Number(id),
            page: `/product/${id}`,
        });
    };

    const handleDecrement = () => {
        const nextQuantity = decrementQuantity(product, quantity);
        if (nextQuantity > 0) {
            updateQuantity(Number(id), nextQuantity);
        } else if (quantity > 0) {
            removeFromCart(Number(id));
        }
    };

    const handleWishlistToggle = async () => {
        if (!product) return;

        if (!user) {
            toast.error('Please login to use wishlist');
            return;
        }

        try {
            if (isWishlisted) {
                removeWishlistItem(product.id);
                await removeFromWishlist(product.id);
                toast.success('Removed from wishlist');
            } else {
                addWishlistItem(product.id);
                await addToWishlist(product.id);
                toast.success('Added to wishlist');
            }
        } catch (error: any) {
            if (isWishlisted) {
                addWishlistItem(product.id);
            } else {
                removeWishlistItem(product.id);
            }
            toast.error(error?.response?.data?.message || 'Unable to update wishlist');
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                <p className="mt-3 text-sm text-gray-600">Loading product...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="py-20 text-center">
                <p className="text-lg text-gray-600">Product not found</p>
                <Link to="/shop" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
                    Back to Shop
                </Link>
            </div>
        );
    }

    const categoryName = product.category_name || 'Uncategorized';
    const { minQty } = getQuantityRules(product);
    const minQuantityPrice = getMinimumQuantityPrice(product);
    const originalMinQuantityPrice = getOriginalMinimumQuantityPrice(product);
    const productImages = (
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : (product.image_url ? [product.image_url] : [FALLBACK_PRODUCT_IMAGE])
    ).map((img: string) => normalizeImageUrl(img));

    return (
        <div className="animate-fade-in">
            <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-gray-600 sm:mb-4 sm:text-sm">
                <Link to="/" className="transition-colors hover:text-primary-600">Home</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link to="/shop" className="transition-colors hover:text-primary-600">Shop</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-medium text-gray-900">{product.name}</span>
            </nav>

            <button
                onClick={() => navigate(-1)}
                className="group mb-4 flex min-h-[40px] items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back
            </button>

            <div className="grid gap-4 py-1 md:grid-cols-[0.92fr_1.08fr] md:gap-6 lg:gap-8">
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <img
                        src={productImages[selectedImage] || productImages[0]}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = normalizeImageUrl(null); }}
                        alt={product.name}
                        className="h-[300px] w-full object-cover transition-opacity duration-300 sm:h-[400px] lg:h-[480px]"
                    />

                    {productImages.length > 1 && (
                        <div className="hide-scrollbar flex snap-x justify-start gap-3 overflow-x-auto bg-gray-50 p-4">
                            {productImages.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`h-20 w-20 flex-shrink-0 snap-center overflow-hidden rounded-xl border-2 transition-all duration-200 sm:h-24 sm:w-24 ${
                                        selectedImage === idx
                                            ? 'border-primary-500 shadow-md ring-2 ring-primary-200'
                                            : 'border-transparent bg-white opacity-70 hover:opacity-100 hover:shadow-sm'
                                    }`}
                                >
                                    <img
                                        src={img}
                                        alt={`${product.name} view ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = normalizeImageUrl(null); }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 sm:space-y-5">
                    <div>
                        {product.category_tags && product.category_tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {product.category_tags.map((tag: any) => (
                                    <Badge key={tag.id} variant="primary" size="sm">
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <Badge variant="primary" size="sm">
                                {categoryName}
                            </Badge>
                        )}
                        <h1 className="mt-3 mb-2 text-[1.7rem] font-display font-bold leading-tight text-gray-900 sm:text-[2rem] lg:text-[2.25rem]">{product.name}</h1>
                        <p className="max-w-2xl text-sm leading-6 text-gray-600 sm:text-[0.98rem]">{product.description}</p>
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                        {product.discountPrice && originalMinQuantityPrice > minQuantityPrice ? (
                            <>
                                <span className="text-lg text-gray-400 line-through sm:text-xl">Rs. {originalMinQuantityPrice.toFixed(0)}</span>
                                <span className="text-[2rem] font-display font-bold text-green-600 sm:text-[2.25rem]">Rs. {minQuantityPrice.toFixed(0)}</span>
                            </>
                        ) : (
                            <span className="text-[2rem] font-display font-bold text-gray-900 sm:text-[2.25rem]">Rs. {minQuantityPrice.toFixed(0)}</span>
                        )}
                        <span className="pb-1 text-sm text-gray-500 sm:text-base">for {formatQuantity(product, minQty)}</span>
                    </div>

                    <div className="rounded-[1.15rem] bg-gray-50 px-4 py-3 text-xs text-gray-600 sm:text-sm">
                        Minimum quantity: <strong>{formatQuantity(product, minQty)}</strong>
                    </div>

                    <div>
                        {product.stock_quantity > 0 ? (
                            <Badge variant={product.stock_quantity < 10 ? 'warning' : 'success'} size="md">
                                {product.stock_quantity < 10
                                    ? `Only ${product.stock_quantity} left in stock!`
                                    : `In Stock (${product.stock_quantity} available)`}
                            </Badge>
                        ) : (
                            <Badge variant="error" size="md">Out of Stock</Badge>
                        )}
                    </div>

                    <div className="flex flex-col gap-2.5 pt-1 sm:pt-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
                        {quantity > 0 ? (
                            <div className="flex items-center rounded-full border-2 border-primary-200 bg-primary-50 px-1.5">
                                <button
                                    onClick={handleDecrement}
                                    className="rounded-full p-2.5 text-primary-600 transition-all duration-200 hover:bg-primary-500 hover:text-white"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-[5rem] px-2 text-center text-sm font-bold text-primary-700 sm:text-base">{formatQuantity(product, quantity)}</span>
                                <button
                                    onClick={handleIncrement}
                                    className="rounded-full p-2.5 text-primary-600 transition-all duration-200 hover:bg-primary-500 hover:text-white"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        ) : null}

                        {quantity === 0 && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleIncrement}
                                className="flex-1 lg:w-auto"
                                disabled={product.stock_quantity === 0}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                {`Add ${formatQuantity(product, minQty)}`}
                            </Button>
                        )}

                        <button
                            type="button"
                            onClick={handleWishlistToggle}
                            className={`flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors lg:w-auto ${
                                isWishlisted
                                    ? 'border-rose-500 bg-rose-500 text-white'
                                    : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                            }`}
                        >
                            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
                            {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                        </button>

                        {quantity > 0 && (
                            <Link to="/cart" className="flex-1 lg:flex-none">
                                <button className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700 lg:px-6">
                                    View Cart
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className="space-y-3 border-t border-gray-200 pt-4">
                        <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                            <span className="text-gray-600">Delivery</span>
                            <span className="font-semibold text-gray-900">Free delivery on orders above Rs. 500</span>
                        </div>
                        <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                            <span className="text-gray-600">Return Policy</span>
                            <span className="font-semibold text-gray-900">7-day return policy</span>
                        </div>
                        <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                            <span className="text-gray-600">Category</span>
                            {product.category_name ? (
                                <Link to={`/shop?category=${product.category_name.toLowerCase()}`} className="font-semibold text-primary-600 hover:text-primary-700">
                                    {categoryName}
                                </Link>
                            ) : (
                                <span className="font-semibold text-gray-900">{categoryName}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;



