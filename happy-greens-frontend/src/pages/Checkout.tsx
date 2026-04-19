import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { createOrder } from '../services/order.service';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/payment.service';
import { getLoyaltyInfo } from '../services/loyalty.service';
import { getProfileAddresses, type SavedAddress } from '../services/auth.service';
import Button from '../components/Button';
import { Star, Gift, ShoppingCart, MapPin, CreditCard, ChevronRight, Truck, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { trackCheckoutStarted, trackOrderCompleted } from '../services/analytics.service';
import { calculateLineTotal, formatQuantity } from '../utils/productUnits';
import { normalizeImageUrl } from '../utils/image';
import { isPondicherryPincode, SERVICE_AREA_LABEL, SERVICE_STATE } from '../config/pondicherryPincodes';

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
const CHECKOUT_DRAFT_STORAGE_KEY = 'happy-greens-checkout-draft';
const getCheckoutDraftStorageKey = (user?: { id?: number | string | null; email?: string | null } | null) => {
    const userIdentifier = user?.id ?? user?.email ?? 'guest';
    return `${CHECKOUT_DRAFT_STORAGE_KEY}:${String(userIdentifier)}`;
};

type CheckoutDraft = {
    name: string;
    phone: string;
    email: string;
    address: string;
    locality: string;
    landmark: string;
    city: string;
    zip: string;
    state: string;
    paymentMethod: string;
    step: Step;
};

const hasMeaningfulDraft = (draft: Partial<CheckoutDraft>) =>
    Boolean(
        (typeof draft.phone === 'string' && draft.phone.trim()) ||
        (typeof draft.address === 'string' && draft.address.trim()) ||
        (typeof draft.locality === 'string' && draft.locality.trim()) ||
        (typeof draft.landmark === 'string' && draft.landmark.trim()) ||
        (typeof draft.city === 'string' && draft.city.trim()) ||
        (typeof draft.zip === 'string' && draft.zip.trim()) ||
        (typeof draft.state === 'string' && draft.state.trim())
    );

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart, user, clearCart, coupon } = useStore();
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
        city: SERVICE_AREA_LABEL,
        zip: '',
        state: SERVICE_STATE,
        paymentMethod: 'cod'
    });

    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftRestoreComplete, setDraftRestoreComplete] = useState(false);
    const [defaultAddressApplied, setDefaultAddressApplied] = useState(false);
    const [hasActiveDraft, setHasActiveDraft] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [savedAddressesLoaded, setSavedAddressesLoaded] = useState(false);
    const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<number | ''>('');

    const maxRedeemable = Math.min(loyaltyPoints, Math.floor(subtotal * 0.5));
    const loyaltyDiscount = Math.min(pointsToUse, maxRedeemable);
    const couponDiscountAmount = coupon ? coupon.discount : 0;
    const finalTotalDiscount = loyaltyDiscount + couponDiscountAmount;
    const totalAfterDiscounts = Math.max(0, subtotal - finalTotalDiscount);
    const deliveryFee = totalAfterDiscounts >= 300 ? 0 : 30;
    const total = totalAfterDiscounts + deliveryFee;
    const draftStorageKey = getCheckoutDraftStorageKey(user);

    useEffect(() => {
        if (user) {
            getLoyaltyInfo()
                .then(info => setLoyaltyPoints(info.loyalty_points))
                .catch(() => { });
        }
    }, [user]);

    useEffect(() => {
        try {
            const rawDraft = localStorage.getItem(draftStorageKey);
            if (rawDraft) {
                const draft = JSON.parse(rawDraft) as Partial<CheckoutDraft>;
                setHasActiveDraft(hasMeaningfulDraft(draft));
                setFormData((current) => ({
                    ...current,
                    name: typeof draft.name === 'string' && draft.name.trim().length > 0
                        ? draft.name
                        : (user?.full_name || current.name),
                    phone: typeof draft.phone === 'string' ? normalizeIndianPhone(draft.phone) : current.phone,
                    email: user?.email || (typeof draft.email === 'string' ? draft.email : current.email),
                    address: typeof draft.address === 'string' ? draft.address : current.address,
                    locality: typeof draft.locality === 'string' ? draft.locality : current.locality,
                    landmark: typeof draft.landmark === 'string' ? draft.landmark : current.landmark,
                    city: typeof draft.city === 'string' ? draft.city : current.city,
                    zip: typeof draft.zip === 'string' ? normalizePincode(draft.zip) : current.zip,
                    state: typeof draft.state === 'string' ? draft.state : current.state,
                    paymentMethod: draft.paymentMethod === 'razorpay' ? 'razorpay' : current.paymentMethod,
                }));

                if (draft.step === 'address' || draft.step === 'payment') {
                    setStep(draft.step);
                }
            } else {
                setHasActiveDraft(false);
            }
        } catch (error) {
            console.warn('Failed to restore checkout draft', error);
            setHasActiveDraft(false);
        }
        setDraftRestoreComplete(true);
    }, [draftStorageKey, user?.email, user?.full_name]);

    useEffect(() => {
        if (!user || !draftRestoreComplete || savedAddressesLoaded) return;

        const fetchSavedAddresses = async () => {
            try {
                const data = await getProfileAddresses();
                const addresses = data.addresses || [];
                setSavedAddresses(addresses);

                const defaultAddress = addresses.find((item) => item.is_default);
                if (defaultAddress && !hasActiveDraft && !defaultAddressApplied) {
                    setSelectedSavedAddressId(defaultAddress.id);
                    setFormData((current) => ({
                        ...current,
                        name: current.name.trim() ? current.name : defaultAddress.full_name,
                        phone: current.phone.trim() ? current.phone : defaultAddress.phone,
                        address: current.address.trim() ? current.address : defaultAddress.address_line,
                        locality: current.locality.trim() ? current.locality : (defaultAddress.locality || ''),
                        landmark: current.landmark.trim() ? current.landmark : (defaultAddress.landmark || ''),
                        city: current.city.trim() ? current.city : defaultAddress.city,
                        zip: current.zip.trim() ? current.zip : defaultAddress.zip,
                        state: current.state.trim() ? current.state : (defaultAddress.state || ''),
                    }));
                    setDefaultAddressApplied(true);
                }
            } catch (error) {
                console.error('Failed to load saved addresses for checkout', error);
            } finally {
                setSavedAddressesLoaded(true);
            }
        };

        fetchSavedAddresses();
    }, [user, draftRestoreComplete, savedAddressesLoaded, hasActiveDraft, defaultAddressApplied]);

    useEffect(() => {
        if (!draftRestoreComplete) return;

        const draft: CheckoutDraft = {
            ...formData,
            email: user?.email || formData.email,
            step,
        };

        try {
            localStorage.setItem(draftStorageKey, JSON.stringify(draft));
        } catch (error) {
            console.warn('Failed to save checkout draft', error);
        }
    }, [draftRestoreComplete, draftStorageKey, formData, step, user?.email]);

    useEffect(() => {
        if (cart.length > 0) {
            trackCheckoutStarted({ page: '/checkout', total: subtotal, item_count: cart.length, coupon: coupon?.code });
        }
    }, [cart.length, coupon?.code, subtotal]);

    const handleAddressContinue = () => {
        if (!user) {
            toast.error('Please login to continue checkout');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

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

        if (!isPondicherryPincode(formData.zip)) {
            toast.error(`Sorry, we currently deliver only in ${SERVICE_AREA_LABEL}. Please enter a valid ${SERVICE_AREA_LABEL} pincode.`);
            return;
        }

        setStep('payment');
    };

    const applySavedAddress = (savedAddress: SavedAddress) => {
        setSelectedSavedAddressId(savedAddress.id);
        setFormData((current) => ({
            ...current,
            name: savedAddress.full_name,
            phone: savedAddress.phone,
            address: savedAddress.address_line,
            locality: savedAddress.locality || '',
            landmark: savedAddress.landmark || '',
            city: savedAddress.city,
            zip: savedAddress.zip,
            state: savedAddress.state || '',
        }));
        setHasActiveDraft(true);
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
                    pointsUsed: loyaltyDiscount,
                    couponCode: coupon?.code,
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
                    address_line: formData.address,
                    locality: formData.locality,
                    landmark: formData.landmark,
                    city: formData.city,
                    zip: formData.zip,
                    phone: formData.phone,
                    state: formData.state,
                },
                paymentMethod: formData.paymentMethod,
                paymentIntentId,
                paymentDetails,
                pointsUsed: loyaltyDiscount,
                couponCode: coupon?.code,
                clientOrderToken: clientOrderTokenRef.current
            };

            const createdOrder = await createOrder(orderData);

            trackOrderCompleted({
                order_id: createdOrder?.id || createdOrder?.order?.id,
                total,
                coupon: coupon?.code,
                item_count: cart.length,
            });

            if (loyaltyDiscount > 0) {
                toast.success(`You saved ₹${loyaltyDiscount} using loyalty points!`);
            }
            toast.success('Order placed successfully!');
            localStorage.removeItem(draftStorageKey);
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
                                <h2 className="text-lg font-bold text-gray-900 mb-3">Shipping address</h2>
                                {!user && (
                                    <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-5">
                                        <p className="text-sm font-medium text-gray-900">Login before entering address and payment details.</p>
                                        <p className="mt-1 text-sm text-gray-600">We’ll save your checkout details to your account once you sign in.</p>
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => navigate('/login', { state: { from: location.pathname } })}
                                            >
                                                Login to continue
                                            </Button>
                                            <Link
                                                to="/cart"
                                                className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
                                            >
                                                Back to cart
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                                    <p className="text-sm text-amber-800">We currently deliver only in <strong>{SERVICE_AREA_LABEL}</strong>.</p>
                                </div>

                                {user && savedAddresses.length > 0 && (
                                    <div className="mb-5">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-semibold text-gray-900">Saved addresses</h3>
                                            <Link to="/profile" className="text-xs font-semibold text-green-600 hover:text-green-700">
                                                Manage
                                            </Link>
                                        </div>
                                        <div className="space-y-2">
                                            <select
                                                className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                value={selectedSavedAddressId}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (!value) return;
                                                    const selected = savedAddresses.find((item) => item.id === Number(value));
                                                    if (selected) {
                                                        applySavedAddress(selected);
                                                    }
                                                }}
                                            >
                                                <option value="">Select a saved address</option>
                                                {savedAddresses.map((savedAddress) => (
                                                    <option key={savedAddress.id} value={savedAddress.id}>
                                                        {savedAddress.label}{savedAddress.is_default ? ' (Default)' : ''} - {savedAddress.city}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedSavedAddressId ? (
                                                (() => {
                                                    const selected = savedAddresses.find((item) => item.id === Number(selectedSavedAddressId));
                                                    if (!selected) return null;
                                                    return (
                                                        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-left">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-gray-900">{selected.label}</p>
                                                                {selected.is_default && (
                                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-sm font-medium text-gray-800">{selected.full_name}</p>
                                                            <p className="mt-1 text-xs text-gray-600">
                                                                {selected.address_line}
                                                                {selected.locality ? `, ${selected.locality}` : ''}
                                                                {selected.landmark ? `, ${selected.landmark}` : ''}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {[selected.city, selected.state, selected.zip].filter(Boolean).join(', ')} · +91 {selected.phone}
                                                            </p>
                                                        </div>
                                                    );
                                                })()
                                            ) : null}
                                        </div>
                                    </div>
                                )}

                                <fieldset disabled={!user} className={`space-y-4 ${!user ? 'opacity-60' : ''}`}>
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
                                                placeholder="Enter Pondicherry pin code"
                                                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                value={formData.zip}
                                                onChange={(e) => setFormData({ ...formData, zip: normalizePincode(e.target.value) })}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">E.g. 605001, 605007, etc.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                City <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                readOnly
                                                className="w-full min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                                                value={formData.city}
                                            />
                                        </div>
                                    </div>

                                    {/* State */}
                                    <div className="sm:w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                                            value={formData.state}
                                        />
                                    </div>
                                </fieldset>
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
                                        {loyaltyDiscount > 0 && (
                                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-700">
                                                <Gift className="h-4 w-4" />
                                                <span className="text-sm font-semibold">Discount applied: ₹{loyaltyDiscount} off your order.</span>
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
                                        {totalAfterDiscounts >= 300 && (
                                            <p className="text-xs text-green-600">Free delivery on orders above ₹300</p>
                                        )}
                                    </div>
                                    {deliveryFee === 0 ? (
                                        <span className="font-medium text-green-600">FREE</span>
                                    ) : (
                                        <span className="font-medium text-gray-900">₹{deliveryFee}</span>
                                    )}
                                </div>
                                {couponDiscountAmount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Coupon ({coupon?.code})</span>
                                        <span>-₹{couponDiscountAmount}</span>
                                    </div>
                                )}
                                {loyaltyDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Loyalty discount</span>
                                        <span>-₹{loyaltyDiscount}</span>
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

                            {totalAfterDiscounts < 300 && (
                                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
                                    <p className="text-xs text-green-700 font-medium">
                                        🎉 Save ₹{deliveryFee} on delivery fee by adding ₹{(300 - totalAfterDiscounts).toFixed(0)} more to cart
                                    </p>
                                </div>
                            )}

                            {finalTotalDiscount > 0 && (
                                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
                                    <p className="text-xs text-green-700 font-semibold">
                                        You have saved ₹{finalTotalDiscount} on your order! Yay!
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
                                {user ? 'Continue' : 'Login to continue'}
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
