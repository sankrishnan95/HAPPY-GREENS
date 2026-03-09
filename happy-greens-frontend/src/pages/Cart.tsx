import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Trash2, Plus, Minus } from 'lucide-react';
import { normalizeImageUrl } from '../utils/image';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart } = useStore();
    const total = cart.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);

    if (cart.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-6">🛒</div>
                <h2 className="text-3xl font-display font-bold mb-4 text-gray-900">Your cart is empty</h2>
                <p className="text-gray-600 mb-8">Add some fresh groceries to get started!</p>
                <Link to="/shop">
                    <button className="bg-gradient-primary text-white px-8 py-3 rounded-full font-bold hover:shadow-glow transition-all">
                        Start Shopping
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-8 text-gray-900">Shopping Cart</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-medium transition-shadow">
                            <div className="flex items-center gap-6">
                                <div className="bg-gradient-soft p-4 rounded-xl">
                                    <img src={normalizeImageUrl(item.images && item.images.length > 0 ? item.images[0] : item.image_url)} alt={item.name} className="w-24 h-24 object-contain" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-display font-bold text-xl text-gray-900 mb-1">{item.name}</h3>
                                    <div className="text-sm mb-3">
                                        {item.discountPrice ? (
                                            <>
                                                <span className="line-through text-gray-400 mr-2">₹{item.price}</span>
                                                <span className="font-bold text-green-600">₹{item.discountPrice} / unit</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-500">₹{item.price} / unit</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-primary-50 rounded-full border-2 border-primary-200">
                                            <button
                                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                className="p-2 text-primary-600 hover:bg-primary-500 hover:text-white rounded-full transition-all"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="font-bold text-primary-700 w-10 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-2 text-primary-600 hover:bg-primary-500 hover:text-white rounded-full transition-all"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Remove item"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-display font-bold text-2xl text-gray-900">₹{(item.discountPrice || item.price) * item.quantity}</div>
                                    <div className="text-sm text-gray-500 mt-1">{item.quantity} × ₹{item.discountPrice || item.price}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary - Sticky */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-soft p-6 rounded-3xl shadow-soft border border-gray-100 sticky top-24">
                        <h3 className="font-display font-bold text-2xl mb-6 text-gray-900">Order Summary</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal ({cart.length} items)</span>
                                <span className="font-semibold">₹{total}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Delivery</span>
                                <span className="font-semibold text-green-600">Free</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Tax</span>
                                <span className="font-semibold">₹0</span>
                            </div>
                        </div>
                        <div className="border-t-2 border-gray-200 pt-4 flex justify-between font-display font-bold text-2xl mb-6 text-gray-900">
                            <span>Total</span>
                            <span>₹{total}</span>
                        </div>
                        <Link to="/checkout">
                            <button className="w-full bg-gradient-primary text-white py-4 rounded-full font-bold text-lg hover:shadow-glow transition-all">
                                Proceed to Checkout
                            </button>
                        </Link>
                        <p className="text-center text-sm text-gray-500 mt-4">Free delivery on all orders above ₹500</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;

