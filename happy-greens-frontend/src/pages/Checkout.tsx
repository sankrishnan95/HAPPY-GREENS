import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { createOrder } from '../services/order.service';
import { getLoyaltyInfo } from '../services/loyalty.service';
import Button from '../components/Button';
import { Star, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, user, clearCart } = useStore();
    const subtotal = cart.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);
    const clientOrderTokenRef = useRef(
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    );

    const [formData, setFormData] = useState({
        address: '',
        city: '',
        zip: '',
        paymentMethod: 'cod'
    });

    // Loyalty state
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const maxRedeemable = Math.min(loyaltyPoints, Math.floor(subtotal * 0.5));
    const discount = Math.min(pointsToUse, maxRedeemable);
    const total = Math.max(0, subtotal - discount);

    useEffect(() => {
        if (user) {
            getLoyaltyInfo()
                .then(info => setLoyaltyPoints(info.loyalty_points))
                .catch(() => { }); // silently fail — not critical for checkout
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!user) {
            alert('Please login to checkout');
            navigate('/login');
            return;
        }

        try {
            setIsSubmitting(true);
            const orderData = {
                items: cart.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.discountPrice || item.price
                })),
                totalAmount: subtotal,
                shippingAddress: {
                    address: formData.address,
                    city: formData.city,
                    zip: formData.zip
                },
                paymentMethod: formData.paymentMethod,
                paymentIntentId: formData.paymentMethod === 'cod' ? null : 'mock_payment_id_' + Date.now(),
                pointsUsed: discount,
                clientOrderToken: clientOrderTokenRef.current
            };

            await createOrder(orderData);

            if (discount > 0) {
                toast.success(`You saved ₹${discount} using loyalty points! 🎉`);
            }
            toast.success('Order placed successfully!');
            clearCart();
            navigate('/orders');
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Failed to place order. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Shipping Address */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                                rows={3}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                                    value={formData.zip}
                                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                    <div className="space-y-3">
                        <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                name="payment"
                                value="razorpay"
                                checked={formData.paymentMethod === 'razorpay'}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="ml-3 font-medium">Razorpay (UPI, Cards, Netbanking)</span>
                        </label>
                        <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                name="payment"
                                value="cod"
                                checked={formData.paymentMethod === 'cod'}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="ml-3 font-medium">Cash on Delivery (COD)</span>
                        </label>
                    </div>
                </div>

                {/* Loyalty Points */}
                {user && loyaltyPoints > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                            <h2 className="text-lg font-bold text-gray-900">Use Loyalty Points</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            You have <strong className="text-yellow-600">{loyaltyPoints} points</strong> available
                            (max ₹{maxRedeemable} discount on this order).
                        </p>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={0}
                                max={maxRedeemable}
                                value={pointsToUse}
                                onChange={(e) => setPointsToUse(Math.max(0, Math.min(Number(e.target.value), maxRedeemable)))}
                                className="w-32 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 text-center font-semibold text-gray-800 bg-white"
                                placeholder="0"
                            />
                            <button
                                type="button"
                                onClick={() => setPointsToUse(maxRedeemable)}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg text-sm transition-colors"
                            >
                                Use Max
                            </button>
                            {pointsToUse > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setPointsToUse(0)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-lg text-sm transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {discount > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2">
                                <Gift className="w-4 h-4" />
                                <span className="text-sm font-semibold">Discount applied: ₹{discount} off your order!</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Order Summary */}
                <div className="bg-gray-50 p-6 rounded-2xl">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 font-semibold">
                                <span>Loyalty Discount ({discount} pts)</span>
                                <span>− ₹{discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t pt-2 flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-4 text-lg shadow-lg shadow-green-200"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing your order...' : <>Pay {String.fromCharCode(8377)}{total.toFixed(2)}</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Checkout;
