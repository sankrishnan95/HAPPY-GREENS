import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { createOrder } from '../services/order.service';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/payment.service';
import { getLoyaltyInfo } from '../services/loyalty.service';
import Button from '../components/Button';
import { Star, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { trackEvent } from '../services/analytics.service';
import { calculateLineTotal } from '../utils/productUnits';

declare global {
    interface Window {
        Razorpay?: any;
    }
}

const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, user, clearCart } = useStore();
    const subtotal = cart.reduce((acc, item) => acc + calculateLineTotal(item, item.quantity), 0);
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
                .catch(() => { });
        }
    }, [user]);

    useEffect(() => {
        if (cart.length > 0) {
            trackEvent('checkout_start', { page: '/checkout' });
        }
    }, [cart.length]);

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
            let paymentIntentId: string | null = null;
            let paymentDetails: any = null;

            if (formData.paymentMethod === 'razorpay') {
                const sdkLoaded = await loadRazorpayScript();
                if (!sdkLoaded) {
                    throw new Error('Failed to load Razorpay SDK');
                }

                const razorpayOrder = await createRazorpayOrder({
                    items: cart.map((item) => ({
                        product_id: item.id,
                        quantity: item.quantity,
                    })),
                    pointsUsed: discount,
                });

                const paymentResult = await new Promise<any>((resolve, reject) => {
                    const razorpay = new window.Razorpay({
                        key: razorpayOrder.key,
                        amount: razorpayOrder.amount,
                        currency: razorpayOrder.currency,
                        name: 'Happy Greens',
                        description: 'Order payment',
                        order_id: razorpayOrder.orderId,
                        prefill: {
                            name: user.full_name,
                            email: user.email,
                            contact: user.phone || undefined,
                        },
                        notes: {
                            source: 'storefront_checkout',
                        },
                        theme: {
                            color: '#16a34a',
                        },
                        method: {
                            upi: true,
                            card: true,
                            netbanking: true,
                            wallet: true,
                        },
                        handler: async (response: any) => {
                            try {
                                const verification = await verifyRazorpayPayment(response);
                                resolve(verification.payment);
                            } catch (verificationError) {
                                reject(verificationError);
                            }
                        },
                        modal: {
                            ondismiss: () => reject(new Error('Payment cancelled')),
                        },
                    });

                    razorpay.open();
                });

                paymentIntentId = paymentResult.id;
                paymentDetails = {
                    orderId: paymentResult.order_id,
                    method: paymentResult.method,
                    status: paymentResult.status,
                    currency: paymentResult.currency,
                    amount: paymentResult.amount,
                    email: paymentResult.email,
                    contact: paymentResult.contact,
                };
            }

            const orderData = {
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                })),
                shippingAddress: {
                    address: formData.address,
                    city: formData.city,
                    zip: formData.zip
                },
                paymentMethod: formData.paymentMethod,
                paymentIntentId,
                paymentDetails,
                pointsUsed: discount,
                clientOrderToken: clientOrderTokenRef.current
            };

            await createOrder(orderData);

            if (discount > 0) {
                toast.success(`You saved ₹${discount} using loyalty points!`);
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
        <div className="mx-auto max-w-3xl px-0 sm:px-2">
            <h1 className="mb-6 text-3xl font-bold sm:mb-8">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                    <h2 className="mb-4 text-xl font-bold">Shipping Address</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                            <textarea
                                required
                                className="min-h-[120px] w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary"
                                rows={3}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    required
                                    className="min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">ZIP Code</label>
                                <input
                                    type="text"
                                    required
                                    className="min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                                    value={formData.zip}
                                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                    <h2 className="mb-4 text-xl font-bold">Payment Method</h2>
                    <div className="space-y-3">
                        <label className="flex min-h-[52px] items-center rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
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
                        <label className="flex min-h-[52px] items-center rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
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

                {user && loyaltyPoints > 0 && (
                    <div className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-4 sm:p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
                            <h2 className="text-lg font-bold text-gray-900">Use Loyalty Points</h2>
                        </div>
                        <p className="mb-4 text-sm text-gray-600">
                            You have <strong className="text-yellow-600">{loyaltyPoints} points</strong> available
                            (max ₹{maxRedeemable} discount on this order).
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <input
                                type="number"
                                min={0}
                                max={maxRedeemable}
                                value={pointsToUse}
                                onChange={(e) => setPointsToUse(Math.max(0, Math.min(Number(e.target.value), maxRedeemable)))}
                                className="min-h-[44px] w-full rounded-lg border border-yellow-300 bg-white px-3 py-2 text-center font-semibold text-gray-800 focus:ring-2 focus:ring-yellow-400 sm:w-32"
                                placeholder="0"
                            />
                            <button
                                type="button"
                                onClick={() => setPointsToUse(maxRedeemable)}
                                className="min-h-[44px] rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-yellow-600"
                            >
                                Use Max
                            </button>
                            {pointsToUse > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setPointsToUse(0)}
                                    className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {discount > 0 && (
                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-700">
                                <Gift className="h-4 w-4" />
                                <span className="text-sm font-semibold">Discount applied: ₹{discount} off your order.</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="rounded-2xl bg-gray-50 p-4 sm:p-6">
                    <div className="mb-4 space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between font-semibold text-green-600">
                                <span>Loyalty Discount ({discount} pts)</span>
                                <span>- ₹{discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t pt-2 text-lg font-bold">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        className="mobile-full-button py-4 text-base shadow-lg shadow-green-200 sm:text-lg"
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
