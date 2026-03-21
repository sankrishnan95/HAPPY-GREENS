import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getOrderById } from '../services/order.service';
import { ArrowLeft, MapPin, Package, CreditCard, Clock } from 'lucide-react';
import { normalizeImageUrl } from '../utils/image';

const STATUS_STYLES: Record<string, string> = {
    placed: 'bg-orange-100 text-orange-800',
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useStore((s) => ({ user: s.user }));
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        getOrderById(id!)
            .then(data => setOrder(data))
            .catch(() => setError('Order not found'))
            .finally(() => setLoading(false));
    }, [id, user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-3xl mx-auto text-center py-16">
                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{error || 'Order not found'}</p>
                <Link to="/orders" className="mt-4 inline-block text-green-600 font-semibold hover:underline">← Back to Orders</Link>
            </div>
        );
    }

    const subtotal = order.items?.reduce(
        (sum: number, item: any) => sum + parseFloat(item.price_at_purchase) * item.quantity, 0
    ) || parseFloat(order.total_amount);

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">Order #{order.id}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {order.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    Order Information
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Order ID</p>
                        <p className="font-semibold text-gray-900">#{order.id}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="font-semibold text-gray-900 uppercase">{order.payment_method || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-semibold text-gray-900 capitalize">{order.status}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Total Amount</p>
                        <p className="font-bold text-green-700 text-base">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Delivery Address */}
            {order.shipping_address && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        Delivery Address
                    </h2>
                    <address className="text-sm text-gray-700 not-italic leading-relaxed space-y-0.5">
                        {order.shipping_address.name && <p className="font-semibold">{order.shipping_address.name}</p>}
                        {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
                        {order.shipping_address.street && <p>{order.shipping_address.street}</p>}
                        {(order.shipping_address.city || order.shipping_address.state) && (
                            <p>{[order.shipping_address.city, order.shipping_address.state, order.shipping_address.zipCode].filter(Boolean).join(', ')}</p>
                        )}
                    </address>
                </div>
            )}

            {/* Ordered Products */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="font-semibold text-base text-gray-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        Ordered Products
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Price</th>
                                <th className="px-6 py-3">Qty</th>
                                <th className="px-6 py-3 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {order.items?.map((item: any) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                {item.image_url ? (
                                                    <img src={normalizeImageUrl(item.image_url)} alt={item.product_name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = normalizeImageUrl(null); }} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">₹{parseFloat(item.price_at_purchase).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">× {item.quantity}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                                        ₹{(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Summary */}
                <div className="p-6 border-t border-gray-100 flex justify-end">
                    <div className="w-full sm:w-56 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 pb-3 border-b border-gray-100">
                            <span>Delivery Fee</span>
                            <span className="font-medium text-gray-900">₹0.00</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 pt-1">
                            <span>Total</span>
                            <span className="text-green-700">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Timeline */}
            {order.timeline?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-semibold text-base text-gray-900 mb-6 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Order Timeline
                    </h2>
                    <div className="relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />
                        <div className="space-y-6">
                            {order.timeline.map((event: any, idx: number) => (
                                <div key={event.id ?? idx} className="relative flex items-start gap-5 pl-10">
                                    <div className={`absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full ring-4 ring-white ${idx === 0 ? 'bg-green-600' : 'bg-gray-300'}`}>
                                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 capitalize text-sm">{event.new_status?.replace(/_/g, ' ')}</h3>
                                            {event.old_status && (
                                                <span className="text-xs text-gray-400">← {event.old_status}</span>
                                            )}
                                        </div>
                                        {event.notes && (
                                            <p className="text-sm text-gray-500 mt-0.5">{event.notes}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(event.changed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



