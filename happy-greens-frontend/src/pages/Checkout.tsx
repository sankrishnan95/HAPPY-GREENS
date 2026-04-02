import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { createOrder } from '../services/order.service';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/payment.service';
import { getLoyaltyInfo } from '../services/loyalty.service';
import Button from '../components/Button';
import { Star, Gift, ShoppingCart, MapPin, CreditCard, ChevronRight, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { trackEvent } from '../services/analytics.service';
import { calculateLineTotal, formatQuantity } from '../utils/productUnits';
import { normalizeImageUrl } from '../utils/image';

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

type Step = 'address' | 'payment';

const normalizeIndianPhone = (value: string) => value.replace(/\D/g, '').slice(-10);
const normalizePincode = (value: string) => value.replace(/\D/g, '').slice(0, 6);

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, user, clearCart } = useStore();
    const subtotal = cart.reduce((acc, item) => acc + calculateLineTotal(item, item.quantity), 0);
    const clientOrderTokenRef = useRef(
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    );

    const [step, setStep] = useState<Step>('address');

    const [formData, setFormData] = useState({
        name: user?.full_name || '',
        phone: '',
        email: user?.email || '',
        address: '',
        locality: '',
        landmark: '',
        city: '',
        zip: '',
        state: '',
        paymentMethod: 'cod'
    });

    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const maxRedeemable = Math.min(loyaltyPoints, Math.floor(subtotal * 0.5));
    const discount = Math.min(pointsToUse, maxRedeemable);
    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount + deliveryFee);

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

    const handleAddressContinue = () => {
        if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim() || !formData.zip.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!/^\d{10}$/.test(formData.phone)) {
            toast.error('Phone number must be a valid 10-digit mobile number');
            return;
        }

        if (!/^\d{6}$/.test(formData.zip)) {
            toast.error('Pincode must be a valid 6-digit code');
            return;
        }

        setStep('payment');
    };

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

            const fullAddress = [formData.address, formData.locality, formData.landmark].filter(Boolean).join(', ');

            const orderData = {
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                })),
                shippingAddress: {
                    name: formData.name,
                    address: fullAddress,
                    city: formData.city,
                    zip: formData.zip,
                    phone: formData.phone,
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

    const steps = [
        { key: 'cart', label: 'CART', icon: ShoppingCart, done: true },
        { key: 'address', label: 'ADDRESS', icon: MapPin, done: step === 'payment', active: step === 'address' },
        { key: 'payment', label: 'PAYMENT', icon: CreditCard, done: false, active: step === 'payment' },
    ];

    return (
        <div className="mx-auto max-w-6xl px-0 sm:px-2">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-0 mb-8">
                {steps.map((s, idx) => (
                    <div key={s.key} className="flex items-center">
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                                ${s.done ? 'bg-green-600 text-white' : s.active ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {s.done ? '✓' : idx + 1}
                            </div>
                            <span className={`text-xs font-semibold tracking-wide
                                ${s.done || s.active ? 'text-gray-900' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-16 sm:w-24 h-0.5 mx-3 ${s.done ? 'bg-green-600' : 'bg-gray-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                {/* Left Side - Forms */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Address */}
                        {step === 'address' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-5">Shipping address</h2>

                                <div className="space-y-4">
                                    {/* Name & Phone */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter name"
                                                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mobile Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                inputMode="numeric"
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                                placeholder="+91 Enter mobile number"
                                                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: normalizeIndianPhone(e.target.value) })}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Enter a valid 10-digit mobile number.</p>
                                        </div>
                                    </div>

                                    {/* Email (optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address (optional)
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Enter email address"
                                            className={`w-full min-h-[44px] rounded-lg border px-4 py-2.5 text-sm ${user ? 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500'}`}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            readOnly={!!user}
                                            disabled={!!user}
                                        />
                                        {user && <p className="mt-1 text-xs text-gray-500">Your account email is fixed and cannot be edited here.</p>}
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder="Flat / House No, Building, Colony"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>

                                    {/* Locality & Landmark */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Locality / Area (optional)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="E.g. MG Road, Gandhi Nagar"
                                                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                value={formData.locality}
                                                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Landmark (optional)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="E.g. Near Bank, Chowk, etc."
                                                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                value={formData.landmark}
                                                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Pin Code & City */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Pin Code <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                inputMode="numeric"
                                                pattern="[0-9]{6}"
                                                maxLength={6}
                                                placeholder="Enter pin code"
                                                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                value={formData.zip}
                                                onChange={(e) => setFormData({ ...formData, zip: normalizePincode(e.target.value) })}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Pincode must be 6 digits.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                City <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter city"
                                                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* State */}
                                    <div className="sm:w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            State
                                        </label>
                                        <select
                                            className="w-full min-h-[44px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        >
                                            <option value="">Select state</option>
                                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                                            <option value="Bihar">Bihar</option>
                                            <option value="Delhi">Delhi</option>
                                            <option value="Goa">Goa</option>
                                            <option value="Gujarat">Gujarat</option>
                                            <option value="Haryana">Haryana</option>
                                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                                            <option value="Jharkhand">Jharkhand</option>
                                            <option value="Karnataka">Karnataka</option>
                                            <option value="Kerala">Kerala</option>
                                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                                            <option value="Maharashtra">Maharashtra</option>
                                            <option value="Odisha">Odisha</option>
                                            <option value="Punjab">Punjab</option>
                                            <option value="Rajasthan">Rajasthan</option>
                                            <option value="Tamil Nadu">Tamil Nadu</option>
                                            <option value="Telangana">Telangana</option>
                                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                                            <option value="West Bengal">West Bengal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment */}
                        {step === 'payment' && (
                            <div className="space-y-5">
                                {/* Address Summary */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-green-600" />
                                            Delivering to
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => setStep('address')}
                                            className="text-sm font-semibold text-green-600 hover:text-green-700"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-0.5">
                                        <p className="font-medium text-gray-900">{formData.name}</p>
                                        <p>{formData.address}{formData.locality ? `, ${formData.locality}` : ''}</p>
                                        <p>{[formData.city, formData.state, formData.zip].filter(Boolean).join(', ')}</p>
                                        <p>{formData.phone}</p>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                    <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Method</h2>
                                    <div className="space-y-3">
                                        {/* TEMPORARILY DISABLED - Razorpay online payments */}
                                        <label className="flex min-h-[52px] items-center rounded-lg border border-gray-200 p-4 cursor-not-allowed opacity-50 bg-gray-50">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="razorpay"
                                                disabled
                                                className="text-gray-400"
                                            />
                                            <div className="ml-3">
                                                <span className="font-medium text-gray-400">Razorpay (UPI, Cards, Netbanking)</span>
                                                <p className="text-xs text-orange-500 mt-0.5">⚠️ Online payment is temporarily unavailable. Please use Cash on Delivery.</p>
                                            </div>
                                        </label>
                                        <label className="flex min-h-[52px] items-center rounded-lg border-2 border-green-500 bg-green-50 p-4 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="cod"
                                                checked={formData.paymentMethod === 'cod'}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                className="text-green-600 focus:ring-green-500"
                                            />
                                            <span className="ml-3 font-medium text-gray-900">Cash on Delivery (COD)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Loyalty Points */}
                                {user && loyaltyPoints > 0 && (
                                    <div className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-5 sm:p-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
                                            <h2 className="text-base font-semibold text-gray-900">Use Loyalty Points</h2>
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
                            </div>
                        )}
                    </form>
                </div>

                {/* Right Side - Order Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-4">
                        {/* Cart Items Preview */}
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                            <h3 className="text-base font-semibold text-gray-900 mb-3">
                                Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                            </h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <img
                                            src={normalizeImageUrl(item.images && item.images.length > 0 ? item.images[0] : item.image_url)}
                                            alt={item.name}
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">× {formatQuantity(item, item.quantity)}</p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">₹{calculateLineTotal(item, item.quantity).toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <Link to="/cart" className="text-sm font-medium text-green-600 hover:text-green-700">
                                    ← Edit cart
                                </Link>
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Item total</span>
                                    <span className="font-medium text-gray-900">₹{subtotal.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <div>
                                        <span>Delivery fee</span>
                                        {subtotal >= 500 && (
                                            <p className="text-xs text-green-600">Free delivery on orders above ₹500</p>
                                        )}
                                    </div>
                                    {deliveryFee === 0 ? (
                                        <span className="font-medium text-green-600">FREE</span>
                                    ) : (
                                        <span className="font-medium text-gray-900">₹{deliveryFee}</span>
                                    )}
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Loyalty discount</span>
                                        <span>-₹{discount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-bold text-gray-900">
                                    <span>Grand total</span>
                                    <span>₹{total.toFixed(0)}</span>
                                </div>
                                <p className="text-xs text-gray-400">Inclusive of all taxes</p>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                                <Truck className="w-3.5 h-3.5" />
                                <span>Average delivery time: <strong>6-24 hours</strong></span>
                            </div>

                            {subtotal < 500 && (
                                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
                                    <p className="text-xs text-green-700 font-medium">
                                        🎉 Save ₹{deliveryFee} on delivery fee by adding ₹{(500 - subtotal).toFixed(0)} more to cart
                                    </p>
                                </div>
                            )}

                            {discount > 0 && (
                                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
                                    <p className="text-xs text-green-700 font-semibold">
                                        You have saved ₹{discount} on your order! Yay!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Continue / Place Order Button */}
                        {step === 'address' ? (
                            <button
                                type="button"
                                onClick={handleAddressContinue}
                                className="w-full min-h-[48px] rounded-xl bg-gray-900 py-3.5 text-base font-bold text-white transition-all hover:bg-gray-800 flex items-center justify-center gap-2"
                            >
                                Continue
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <Button
                                type="button"
                                variant="primary"
                                className="w-full min-h-[48px] py-3.5 text-base font-bold rounded-xl shadow-lg shadow-green-200"
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                                onClick={handleSubmit as any}
                            >
                                {isSubmitting ? 'Processing your order...' : `Place Order • ₹${total.toFixed(0)}`}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
