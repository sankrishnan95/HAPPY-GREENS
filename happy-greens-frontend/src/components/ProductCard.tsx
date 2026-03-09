import { Link } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import Badge from './Badge';
import { addToWishlist, removeFromWishlist } from '../services/wishlist.service';
import toast from 'react-hot-toast';
import { normalizeImageUrl } from '../utils/image';

interface Product {
    id: number;
    name: string;
    price: number;
    discountPrice?: number;
    image_url: string;
    images?: string[];
    category_name?: string;
    stock?: number;
}

const ProductCard = ({ product }: { product: Product }) => {
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

    const handleIncrement = () => {
        addToCart(product);
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(product.id, quantity - 1);
        } else {
            removeFromCart(product.id);
        }
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

    return (
        <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full group hover-lift">
            <Link to={`/product/${product.id}`} className="block relative">
                <div className="aspect-square overflow-hidden bg-gradient-soft relative">
                    <img
                        src={normalizeImageUrl(product.images && product.images.length > 0 ? product.images[0] : product.image_url)}
                        alt={product.name}
                        className="w-full h-full object-cover p-6 group-hover:scale-110 transition-transform duration-500"
                    />

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleWishlistToggle();
                        }}
                        className={`absolute top-3 left-3 p-2 rounded-full border transition-colors ${isWishlisted
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white/90 text-gray-500 border-gray-200 hover:text-rose-500'
                            }`}
                        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-white' : ''}`} />
                    </button>

                    {product.stock !== undefined && product.stock < 10 && (
                        <div className="absolute top-3 right-3">
                            <Badge variant={product.stock === 0 ? 'error' : 'warning'} size="sm">
                                {product.stock === 0 ? 'Out of Stock' : `Only ${product.stock} left`}
                            </Badge>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
            </Link>

            <div className="p-4 flex flex-col flex-grow">
                {product.category_name && (
                    <Badge variant="primary" size="sm" className="mb-2 w-fit">
                        {product.category_name}
                    </Badge>
                )}

                <Link to={`/product/${product.id}`} className="block mb-3 flex-grow">
                    <h3 className="font-display font-semibold text-gray-800 text-lg hover:text-primary-600 transition-colors line-clamp-2" title={product.name}>
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto flex items-center justify-between">
                    <div>
                        {product.discountPrice ? (
                            <>
                                <span className="line-through text-gray-400 mr-2 text-sm">Rs. {product.price}</span>
                                <span className="font-display font-bold text-2xl text-green-600">Rs. {product.discountPrice}</span>
                            </>
                        ) : (
                            <span className="font-display font-bold text-2xl text-gray-900">Rs. {product.price}</span>
                        )}
                        <span className="text-sm text-gray-500 ml-1">/unit</span>
                    </div>

                    {quantity > 0 ? (
                        <div className="flex items-center bg-primary-50 rounded-full border-2 border-primary-200">
                            <button
                                onClick={handleDecrement}
                                className="p-2 text-primary-600 hover:bg-primary-500 hover:text-white rounded-full transition-all duration-200"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-bold text-primary-700 w-8 text-center text-base">{quantity}</span>
                            <button
                                onClick={handleIncrement}
                                className="p-2 text-primary-600 hover:bg-primary-500 hover:text-white rounded-full transition-all duration-200"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => addToCart(product)}
                            className="bg-gradient-primary text-white p-3 rounded-full hover:shadow-glow hover:scale-110 transition-all duration-300 group/btn"
                            title="Add to cart"
                        >
                            <ShoppingCart className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;


