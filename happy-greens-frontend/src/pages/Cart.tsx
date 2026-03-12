import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Trash2, Plus, Minus } from 'lucide-react';
import { normalizeImageUrl } from '../utils/image';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart } = useStore();
    const total = cart.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);

    if (cart.length === 0) {
        return (
            <div className="py-16 text-center sm:py-20">
                <div className="mb-6 text-5xl font-display font-bold text-gray-300 sm:text-6xl">Cart</div>
                <h2 className="mb-4 text-2xl font-display font-bold text-gray-900 sm:text-3xl">Your cart is empty</h2>
                <p className="mb-8 text-sm text-gray-600 sm:text-base">Add some fresh groceries to get started!</p>
                <Link to="/shop">
                    <button className="min-h-[44px] rounded-full bg-gradient-primary px-6 py-3 font-bold text-white transition-all hover:shadow-glow sm:px-8">
                        Start Shopping
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl">
            <h1 className="mb-6 text-3xl font-display font-bold text-gray-900 sm:mb-8 sm:text-4xl">Shopping Cart</h1>

            <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                <div className="space-y-4 lg:col-span-2">
                    {cart.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft transition-shadow hover:shadow-medium sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                                <div className="rounded-xl bg-gradient-soft p-3 sm:p-4">
                                    <img
                                        src={normalizeImageUrl(item.images && item.images.length > 0 ? item.images[0] : item.image_url)}
                                        alt={item.name}
                                        className="h-20 w-20 object-contain sm:h-24 sm:w-24"
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="mb-1 text-lg font-display font-bold text-gray-900 sm:text-xl">{item.name}</h3>
                                            <div className="mb-3 text-sm">
                                                {item.discountPrice ? (
                                                    <>
                                                        <span className="mr-2 line-through text-gray-400">Rs. {item.price}</span>
                                                        <span className="font-bold text-green-600">Rs. {item.discountPrice} / unit</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-500">Rs. {item.price} / unit</span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="hidden rounded-full p-2 text-red-500 transition-colors hover:bg-red-50 sm:inline-flex"
                                            title="Remove item"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                                        <div className="flex items-center rounded-full border-2 border-primary-200 bg-primary-50 w-fit">
                                            <button
                                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                className="rounded-full p-2 text-primary-600 transition-all hover:bg-primary-500 hover:text-white"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-10 text-center font-bold text-primary-700">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="rounded-full p-2 text-primary-600 transition-all hover:bg-primary-500 hover:text-white"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 sm:hidden"
                                            title="Remove item"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <div className="text-left sm:text-right">
                                    <div className="text-xl font-display font-bold text-gray-900 sm:text-2xl">
                                        Rs. {(item.discountPrice || item.price) * item.quantity}
                                    </div>
                                    <div className="mt-1 text-sm text-gray-500">
                                        {item.quantity} x Rs. {item.discountPrice || item.price}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-3xl border border-gray-100 bg-gradient-soft p-5 shadow-soft sm:p-6">
                        <h3 className="mb-6 text-2xl font-display font-bold text-gray-900">Order Summary</h3>
                        <div className="mb-6 space-y-3">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal ({cart.length} items)</span>
                                <span className="font-semibold">Rs. {total}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Delivery</span>
                                <span className="font-semibold text-green-600">Free</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Tax</span>
                                <span className="font-semibold">Rs. 0</span>
                            </div>
                        </div>
                        <div className="mb-6 flex justify-between border-t-2 border-gray-200 pt-4 text-2xl font-display font-bold text-gray-900">
                            <span>Total</span>
                            <span>Rs. {total}</span>
                        </div>
                        <Link to="/checkout">
                            <button className="min-h-[44px] w-full rounded-full bg-gradient-primary py-4 text-base font-bold text-white transition-all hover:shadow-glow sm:text-lg">
                                Proceed to Checkout
                            </button>
                        </Link>
                        <p className="mt-4 text-center text-sm text-gray-500">Free delivery on all orders above Rs. 500</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
