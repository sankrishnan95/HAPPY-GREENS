import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../services/api';
import { Trash2, Plus, Minus } from 'lucide-react';
import { normalizeImageUrl } from '../utils/image';
import { calculateLineTotal, decrementQuantity, formatQuantity, getUnitLabel, incrementQuantity } from '../utils/productUnits';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, coupon, setCoupon } = useStore();
    const [couponInput, setCouponInput] = useState(coupon?.code || '');
    const [isApplying, setIsApplying] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');

    const subtotal = cart.reduce((acc, item) => acc + calculateLineTotal(item, item.quantity), 0);
    const discount = coupon ? Number(coupon.discount) || 0 : 0;
    const totalAfterDiscount = Math.max(0, subtotal - discount);
    const deliveryFee = totalAfterDiscount >= 500 ? 0 : 30;
    const finalTotal = totalAfterDiscount + deliveryFee;

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setIsApplying(true);
        setCouponError('');
        setCouponSuccess('');
        try {
            const mappedCart = cart.map(item => ({
                product_id: item.id,
                category_id: (item as any).category_id,
                price: item.discountPrice || item.pricePerUnit || item.price,
                quantity: item.quantity
            }));
            const res = await api.post('/coupons/validate', { code: couponInput, cart_items: mappedCart });
            if (res.data.valid) {
                setCoupon({ code: res.data.code, discount: Number(res.data.discount_amount), message: res.data.message });
                setCouponSuccess(res.data.message || 'Coupon applied successfully!');
            } else {
                setCouponError(res.data.message || 'Invalid coupon');
                setCoupon(null);
            }
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Failed to apply coupon');
            setCoupon(null);
        } finally {
            setIsApplying(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCoupon(null);
        setCouponInput('');
        setCouponSuccess('');
        setCouponError('');
    };

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
            <h1 className="mb-6 text-2xl font-display font-bold text-gray-900 sm:mb-8">Shopping Cart</h1>

            <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                <div className="space-y-4 lg:col-span-2">
                    {cart.map((item) => {
                        const unitLabel = getUnitLabel(item.unit);
                        const lineTotal = calculateLineTotal(item, item.quantity);
                        const nextIncrement = incrementQuantity(item, item.quantity);
                        const nextDecrement = decrementQuantity(item, item.quantity);

                        return (
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
                                                            <span className="font-bold text-green-600">Rs. {item.discountPrice} / {unitLabel}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-500">Rs. {item.pricePerUnit ?? item.price} / {unitLabel}</span>
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
                                                    onClick={() => nextDecrement > 0 ? updateQuantity(item.id, nextDecrement) : removeFromCart(item.id)}
                                                    className="rounded-full p-2 text-primary-600 transition-all hover:bg-primary-500 hover:text-white"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="min-w-[5rem] px-2 text-center font-bold text-primary-700">{formatQuantity(item, item.quantity)}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, nextIncrement)}
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
                                            Rs. {lineTotal.toFixed(2)}
                                        </div>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {formatQuantity(item, item.quantity)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-3xl border border-gray-100 bg-gradient-soft p-5 shadow-soft sm:p-6">
                        <h3 className="mb-6 text-lg font-display font-bold text-gray-900">Order Summary</h3>
                        <div className="mb-6 space-y-3">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal ({cart.length} items)</span>
                                <span className="font-semibold">Rs. {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <div>
                                    <span>Delivery</span>
                                    {totalAfterDiscount >= 500 && (
                                        <p className="text-xs text-green-600">Free delivery on orders above Rs. 500</p>
                                    )}
                                </div>
                                {totalAfterDiscount >= 500 ? (
                                    <span className="font-semibold text-green-600">Free</span>
                                ) : (
                                    <span className="font-semibold">Rs. 30</span>
                                )}
                            </div>
                            {coupon && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Discount ({coupon.code})</span>
                                    <span>- Rs. {discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-700">
                                <span>Tax</span>
                                <span className="font-semibold">Rs. 0</span>
                            </div>
                        </div>

                        {/* Coupon Section */}
                        <div className="mb-6">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    value={couponInput}
                                    onChange={(e) => {
                                        setCouponInput(e.target.value.toUpperCase());
                                        if (couponError) setCouponError('');
                                    }}
                                    disabled={!!coupon || isApplying}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-2 font-medium uppercase outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                                />
                                {coupon ? (
                                    <button
                                        onClick={handleRemoveCoupon}
                                        className="rounded-xl border border-red-500 bg-white px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={!couponInput.trim() || isApplying}
                                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
                                    >
                                        {isApplying ? '...' : 'Apply'}
                                    </button>
                                )}
                            </div>
                            {couponError && <p className="mt-2 text-sm text-red-500">{couponError}</p>}
                            {couponSuccess && <p className="mt-2 text-sm text-green-600">{couponSuccess}</p>}
                        </div>

                        <div className="mb-6 flex justify-between border-t-2 border-gray-200 pt-4 text-xl font-display font-bold text-gray-900">
                            <span>Total</span>
                            <span>Rs. {finalTotal.toFixed(2)}</span>
                        </div>
                        <Link to="/checkout">
                            <button className="min-h-[44px] w-full rounded-full bg-gradient-primary py-4 text-base font-bold text-white transition-all hover:shadow-glow sm:text-lg">
                                Proceed to Checkout
                            </button>
                        </Link>
                        {totalAfterDiscount < 500 && (
                            <p className="mt-4 text-center text-sm text-green-600 font-medium">
                                🎉 Add Rs. {(500 - totalAfterDiscount).toFixed(0)} more for free delivery!
                            </p>
                        )}
                        {totalAfterDiscount >= 500 && (
                            <p className="mt-4 text-center text-sm text-gray-500">Free delivery on all orders above Rs. 500</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
