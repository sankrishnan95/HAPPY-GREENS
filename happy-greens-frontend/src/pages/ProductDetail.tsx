import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Minus, Plus, ShoppingCart, ArrowLeft, ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { API_BASE_URL } from '../config/api';
import { normalizeImageUrl } from '../utils/image';



const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const { cart, addToCart, updateQuantity, removeFromCart } = useStore((state) => ({
        cart: state.cart,
        addToCart: state.addToCart,
        updateQuantity: state.updateQuantity,
        removeFromCart: state.removeFromCart,
    }));

    const cartItem = cart.find((item) => item.id === Number(id));
    const quantity = cartItem ? cartItem.quantity : 0;

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
                setProduct(res.data);
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
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(Number(id), quantity - 1);
        } else if (quantity === 1) {
            removeFromCart(Number(id));
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20">
                <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading product...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-gray-600">Product not found</p>
                <Link to="/shop" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
                    Back to Shop
                </Link>
            </div>
        );
    }

    const categoryName = product.category_name || 'Uncategorized';
    const productImages = (
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : (product.image_url ? [product.image_url] : [FALLBACK_PRODUCT_IMAGE])
    ).map((img: string) => normalizeImageUrl(img));

    return (
        <div className="animate-fade-in">
            <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
                <ChevronRight className="h-4 w-4" />
                <Link to="/shop" className="hover:text-primary-600 transition-colors">Shop</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 font-medium">{product.name}</span>
            </nav>

            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-6 transition-colors group"
            >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back
            </button>

            <div className="grid md:grid-cols-2 gap-12 py-4">
                <div className="bg-gradient-soft p-8 rounded-4xl shadow-soft border border-gray-100">
                    <div className="relative aspect-square md:aspect-auto">
                        <img
                            src={productImages[selectedImage] || productImages[0] }
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = normalizeImageUrl(null); }}
                            alt={product.name}
                            className="w-full h-[500px] object-contain transition-opacity duration-300"
                        />
                    </div>

                    {productImages.length > 1 && (
                        <div className="flex gap-4 mt-8 overflow-x-auto pb-4 justify-center md:justify-start px-2 snap-x hide-scrollbar">
                            {productImages.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-200 snap-center bg-white ${
                                        selectedImage === idx
                                            ? 'border-primary-500 shadow-md ring-2 ring-primary-200 transform scale-105'
                                            : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105 hover:shadow'
                                    }`}
                                >
                                    <img
                                        src={img}
                                        alt={`${product.name} view ${idx + 1}`}
                                        className="w-full h-full object-cover p-2"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = normalizeImageUrl(null); }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div>
                        <Badge variant="primary" size="md">
                            {categoryName}
                        </Badge>
                        <h1 className="text-5xl font-display font-bold mt-4 mb-3 text-gray-900">{product.name}</h1>
                        <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
                    </div>

                    <div className="flex items-baseline gap-2">
                        {product.discountPrice ? (
                            <>
                                <span className="line-through text-gray-400 text-3xl">Rs. {product.price}</span>
                                <span className="text-5xl font-display font-bold text-green-600">Rs. {product.discountPrice}</span>
                            </>
                        ) : (
                            <span className="text-5xl font-display font-bold text-gray-900">Rs. {product.price}</span>
                        )}
                        <span className="text-lg text-gray-500">/unit</span>
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

                    <div className="flex items-center gap-4 pt-4">
                        {quantity > 0 ? (
                            <div className="flex items-center bg-primary-50 rounded-full border-2 border-primary-200 px-2">
                                <button
                                    onClick={handleDecrement}
                                    className="p-3 text-primary-600 hover:bg-primary-500 hover:text-white rounded-full transition-all duration-200"
                                >
                                    <Minus className="h-5 w-5" />
                                </button>
                                <span className="font-bold text-primary-700 w-12 text-center text-xl">{quantity}</span>
                                <button
                                    onClick={handleIncrement}
                                    className="p-3 text-primary-600 hover:bg-primary-500 hover:text-white rounded-full transition-all duration-200"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                        ) : null}

                        <Button
                            variant={quantity > 0 ? 'secondary' : 'primary'}
                            size="lg"
                            onClick={() => addToCart(product)}
                            className="flex-1"
                            disabled={product.stock_quantity === 0}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {quantity > 0 ? 'Add More' : 'Add to Cart'}
                        </Button>

                        {quantity > 0 && (
                            <Link to="/cart" className="flex-1">
                                <button className="w-full bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                    View Cart
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pt-6 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Delivery</span>
                            <span className="font-semibold text-gray-900">Free delivery on orders above Rs. 500</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Return Policy</span>
                            <span className="font-semibold text-gray-900">7-day return policy</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
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

