import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Package, CreditCard, Clock, CheckCircle, Printer } from 'lucide-react';
import { getOrderById, updateOrderStatus, getInvoiceUrl } from '../services/order.service';
import toast, { Toaster } from 'react-hot-toast';
import { getStatusColor } from '../utils/format';
import { ORDER_STATUS_OPTIONS } from '../utils/status';

const RUPEE = '\u20B9';

export default function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const formatQuantity = (quantity, unit) => {
        const normalizedUnit = String(unit || '').toUpperCase();
        const numericQuantity = Number(quantity);
        if (!Number.isFinite(numericQuantity)) return `${quantity} ${unit || 'units'}`;

        if (normalizedUnit === 'GRAM') {
            if (numericQuantity >= 1000) {
                const kilograms = numericQuantity / 1000;
                return `${Number(kilograms).toFixed(kilograms % 1 === 0 ? 0 : 2)} kg`;
            }
            return `${Math.round(numericQuantity)} g`;
        }

        if (normalizedUnit === 'LITRE') {
            return `${numericQuantity.toFixed(numericQuantity % 1 === 0 ? 0 : 2)} L`;
        }

        if (normalizedUnit === 'DOZEN') {
            return `${Math.round(numericQuantity)} dozen`;
        }

        return `${Math.round(numericQuantity)} pc`;
    };

    const formatPriceUnitLabel = (unit) => {
        switch (String(unit || '').toUpperCase()) {
            case 'GRAM':
                return 'kg';
            case 'LITRE':
                return 'litre';
            case 'DOZEN':
                return 'dozen';
            default:
                return 'piece';
        }
    };

    const getLineTotal = (item) => Number(item.price_at_purchase ?? item.price ?? 0);

    const getUnitPrice = (item) => {
        const normalizedUnit = String(item?.unit || '').toUpperCase();
        const quantity = Number(item?.quantity || 0);
        const lineTotal = getLineTotal(item);

        if (!Number.isFinite(quantity) || quantity <= 0) return lineTotal;

        if (normalizedUnit === 'GRAM') {
            return lineTotal / (quantity / 1000);
        }

        return lineTotal / quantity;
    };

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await getOrderById(id);
            setOrder(response.data);
        } catch (error) {
            console.error('Failed to load order:', error);
            toast.error('Order not found');
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        const notes = window.prompt(`Updating to "${newStatus}". Add a note (optional):`);
        if (notes === null) return;
        try {
            setUpdating(true);
            await updateOrderStatus(id, newStatus, notes || null);
            toast.success(`Order status updated to ${newStatus}`);
            await fetchOrderDetails();
        } catch (error) {
            console.error('Error updating status', error);
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handlePrintInvoice = async () => {
        try {
            const url = getInvoiceUrl(id, 'a4');
            const response = await fetch(url);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${response.status}`);
            }
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const printWindow = window.open(blobUrl, '_blank');
            if (printWindow) {
                printWindow.addEventListener('load', () => {
                    setTimeout(() => {
                        printWindow.print();
                        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
                    }, 500);
                });
            }
        } catch (error) {
            console.error('Invoice error:', error);
            toast.error(`Invoice failed: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!order) return null;

    const subtotal = Number(order.subtotal ?? order.items?.reduce((sum, item) => sum + Number(item.price_at_purchase || 0), 0) ?? order.total_amount ?? 0);
    const discountAmount = Number(order.discount_amount || 0);
    const pointsUsed = Number(order.points_used || 0);
    const couponDiscount = Number(order.coupon_discount || Math.max(0, discountAmount - pointsUsed));
    const deliveryFee = Number(order.delivery_fee ?? Math.max(0, Number(order.total_amount || 0) - subtotal + discountAmount));

    return (
        <div className="space-y-6 pb-12">
            <Toaster position="top-right" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/orders')} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrintInvoice}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </button>
                    <div className="relative">
                        <select
                            disabled={updating}
                            value={order.status}
                            onChange={handleStatusChange}
                            className="appearance-none pl-4 pr-10 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors outline-none cursor-pointer disabled:opacity-50"
                        >
                            {ORDER_STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt} className="text-gray-900 bg-white">{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                            ))}
                        </select>
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-400" />
                            <h2 className="font-bold text-gray-900">Order Items</h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="px-6 py-4 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                        <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.product_name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-gray-900 truncate">{item.product_name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">Quantity: {formatQuantity(item.quantity, item.unit)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{RUPEE}{getLineTotal(item).toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{RUPEE}{getUnitPrice(item).toFixed(2)}/{formatPriceUnitLabel(item.unit)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-6 bg-gray-50 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Payment Method</p>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-bold text-gray-900 uppercase">{order.payment_method}</span>
                                </div>
                            </div>
                            <div className="space-y-1 text-right">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="text-gray-900 font-medium">{RUPEE}{subtotal.toFixed(2)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-700">
                                        <span>You saved</span>
                                        <span className="font-semibold">-{RUPEE}{discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {pointsUsed > 0 && (
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Loyalty points</span>
                                        <span>-{RUPEE}{pointsUsed.toFixed(2)}</span>
                                    </div>
                                )}
                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Coupon discount</span>
                                        <span>-{RUPEE}{couponDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Delivery Fee</span>
                                    <span className="text-gray-900 font-medium">
                                        {deliveryFee === 0 ? 'FREE' : `${RUPEE}${deliveryFee.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-primary-600">{RUPEE}{Number(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <h2 className="font-bold text-gray-900">Order Timeline</h2>
                        </div>
                        <div className="space-y-6">
                            {(order.timeline || []).length > 0 ? (
                                order.timeline.map((event, idx) => (
                                    <div key={idx} className="flex gap-4 relative">
                                        {idx !== order.timeline.length - 1 && (
                                            <div className="absolute left-2.5 top-6 bottom-[-24px] w-0.5 bg-gray-100"></div>
                                        )}
                                        <div className="w-5 h-5 rounded-full bg-primary-100 border-4 border-white shadow-sm flex-shrink-0 mt-1 z-10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-600"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{event.new_status || event.status}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{new Date(event.changed_at || event.created_at).toLocaleString()}</p>
                                            {event.notes && (
                                                <div className="mt-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 text-gray-600 italic">
                                                    "{event.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex gap-4 relative">
                                    <div className="w-5 h-5 rounded-full bg-green-100 border-4 border-white shadow-sm flex-shrink-0 mt-1 z-10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Order Placed</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-gray-400" />
                            <h2 className="font-bold text-gray-900">Customer Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
                                    {order.customer_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
                                    <p className="text-xs text-gray-500">{order.customer_email}</p>
                                    {(order.customer_phone || order.shipping_address?.phone) && (
                                        <p className="text-xs text-gray-500">{order.customer_phone || order.shipping_address?.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <h2 className="font-bold text-gray-900">Delivery Address</h2>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                {order.shipping_address
                                    ? typeof order.shipping_address === 'string'
                                        ? order.shipping_address
                                        : [
                                            order.shipping_address.address,
                                            order.shipping_address.city,
                                            order.shipping_address.zip
                                        ].filter(Boolean).join(', ')
                                    : 'No address provided'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
