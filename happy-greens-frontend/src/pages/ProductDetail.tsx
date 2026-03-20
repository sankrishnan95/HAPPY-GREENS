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

    const handleIncrement = () => {
        if (quantity > 0) {
            updateQuantity(Number(id), quantity + 1);
        } else {
            addToCart(product);
        }
        trackEvent('add_to_cart', {
            product_id: Number(id),
            page: `/product/${id}`,
        });
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(Number(id), quantity - 1);
        } else if (quantity === 1) {
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
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading product...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="py-20 text-center">
                <p className="text-xl text-gray-600">Product not found</p>
                <Link to="/shop" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
                    Back to Shop
                </Link>
            </div>
        );
    }

    const categoryName = product.category_name || 'Uncategorized';
    const productUnit = product.unit || 'piece';
    const productImages = (
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : (product.image_url ? [product.image_url] : [FALLBACK_PRODUCT_IMAGE])
    ).map((img: string) => normalizeImageUrl(img));

    return (
        <div className="animate-fade-in">
            <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600 sm:mb-6">
                <Link to="/" className="transition-colors hover:text-primary-600">Home</Link>
                <ChevronRight className="h-4 w-4" />
                <Link to="/shop" className="transition-colors hover:text-primary-600">Shop</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-gray-900">{product.name}</span>
            </nav>

            <button
                onClick={() => navigate(-1)}
                className="group mb-6 flex min-h-[44px] items-center gap-2 font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                Back
            </button>

            <div className="grid gap-6 py-2 md:grid-cols-2 md:gap-8 md:py-4 lg:gap-12">
                <div className="rounded-4xl border border-gray-100 bg-gradient-soft p-4 shadow-soft sm:p-6 lg:p-8">
                    <div className="relative aspect-square md:aspect-auto">
                        <img
                            src={productImages[selectedImage] || productImages[0]}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = normalizeImageUrl(null); }}
                            alt={product.name}
                            className="h-[280px] w-full object-contain transition-opacity duration-300 sm:h-[380px] lg:h-[500px]"
                        />
                    </div>

                    {productImages.length > 1 && (
                        <div className="hide-scrollbar mt-6 flex snap-x justify-start gap-3 overflow-x-auto px-1 pb-3 sm:mt-8 sm:gap-4 sm:px-2">
                            {productImages.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`h-20 w-20 flex-shrink-0 snap-center overflow-hidden rounded-2xl border-2 bg-white transition-all duration-200 sm:h-24 sm:w-24 ${
                                        selectedImage === idx
                                            ? 'scale-105 transform border-primary-500 shadow-md ring-2 ring-primary-200'
                                            : 'border-transparent opacity-60 hover:scale-105 hover:opacity-100 hover:shadow'
                                    }`}
                                >
                                    <img
                                        src={img}
                                        alt={`${product.name} view ${idx + 1}`}
                                        className="h-full w-full object-cover p-2"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = normalizeImageUrl(null); }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-5 sm:space-y-6">
                    <div>
                        <Badge variant="primary" size="md">
                            {categoryName}
                        </Badge>
                        <h1 className="mt-4 mb-3 text-3xl font-display font-bold text-gray-900 sm:text-4xl lg:text-5xl">{product.name}</h1>
                        <p className="text-base leading-relaxed text-gray-600 sm:text-lg">{product.description}</p>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2">
                        {product.discountPrice ? (
                            <>
                                <span className="text-2xl text-gray-400 line-through sm:text-3xl">Rs. {product.price}</span>
                                <span className="text-3xl font-display font-bold text-green-600 sm:text-4xl lg:text-5xl">Rs. {product.discountPrice}</span>
                            </>
                        ) : (
                            <span className="text-3xl font-display font-bold text-gray-900 sm:text-4xl lg:text-5xl">Rs. {product.price}</span>
                        )}
                        <span className="text-base text-gray-500 sm:text-lg">/{productUnit}</span>
                    </div>

                    <div>
                        {product.stock_quantity > 0 ? (
                            <Badge variant={product.stock_quantity < 10 ? 'warning' : 'success'} size="lg">
                                {product.stock_quantity < 10
                                    ? `Only ${product.stock_quantity} left in stock!`
                                    : `In Stock (${product.stock_quantity} available)`}
                            </Badge>
                        ) : (
                            <Badge variant="error" size="lg">Out of Stock</Badge>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:pt-4 lg:flex-row lg:items-center lg:gap-4">
                        {quantity > 0 ? (
                            <div className="flex items-center rounded-full border-2 border-primary-200 bg-primary-50 px-2">
                                <button
                                    onClick={handleDecrement}
                                    className="rounded-full p-3 text-primary-600 transition-all duration-200 hover:bg-primary-500 hover:text-white"
                                >
                                    <Minus className="h-5 w-5" />
                                </button>
                                <span className="w-12 text-center text-xl font-bold text-primary-700">{quantity}</span>
                                <button
                                    onClick={handleIncrement}
                                    className="rounded-full p-3 text-primary-600 transition-all duration-200 hover:bg-primary-500 hover:text-white"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                        ) : null}

                        <Button
                            variant={quantity > 0 ? 'secondary' : 'primary'}
                            size="lg"
                            onClick={() => {
                                addToCart(product);
                                trackEvent('add_to_cart', {
                                    product_id: Number(id),
                                    page: `/product/${id}`,
                                });
                            }}
                            className="flex-1 lg:w-auto"
                            disabled={product.stock_quantity === 0}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {quantity > 0 ? 'Add More' : 'Add to Cart'}
                        </Button>

                        <button
                            type="button"
                            onClick={handleWishlistToggle}
                            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border px-6 py-3 font-bold transition-colors lg:w-auto ${
                                isWishlisted
                                    ? 'border-rose-500 bg-rose-500 text-white'
                                    : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                            }`}
                        >
                            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-white' : ''}`} />
                            {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                        </button>

                        {quantity > 0 && (
                            <Link to="/cart" className="flex-1">
                                <button className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 font-bold text-white transition-colors hover:bg-green-700 lg:px-8">
                                    View Cart
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className="space-y-4 border-t border-gray-200 pt-6">
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-gray-600">Delivery</span>
                            <span className="font-semibold text-gray-900">Free delivery on orders above Rs. 500</span>
                        </div>
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-gray-600">Return Policy</span>
                            <span className="font-semibold text-gray-900">7-day return policy</span>
                        </div>
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
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
