import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getOrders, cancelOrder as cancelOrderRequest } from '../services/order.service';
import { Package, ChevronRight } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
    placed: 'bg-orange-100 text-orange-800',
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersList() {
    const navigate = useNavigate();
    const { user } = useStore((s) => ({ user: s.user }));
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const canCancelOrder = (status?: string) => ['pending', 'placed', 'accepted', 'paid'].includes(String(status || '').toLowerCase());

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        getOrders()
            .then(data => setOrders(data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [user]);

    const handleCancelOrder = async (event: React.MouseEvent, orderId: number) => {
        event.stopPropagation();
        if (cancellingId === orderId) return;
        if (!window.confirm(`Cancel order #${orderId}?`)) return;

        try {
            setCancellingId(orderId);
            await cancelOrderRequest(orderId);
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId
                        ? { ...order, status: 'cancelled', updated_at: new Date().toISOString() }
                        : order
                )
            );
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <Package className="w-7 h-7 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-500">No orders yet</h2>
                    <p className="text-gray-400 mt-1">Your placed orders will appear here.</p>
                    <Link to="/shop" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order: any) => (
                        <div
                            key={order.id}
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-green-200 transition-all flex justify-between items-center"
                        >
                            <div className="space-y-1">
                                <p className="font-bold text-gray-900">Order #{order.id}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                </p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-700">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                                    <p className="text-xs text-gray-400 uppercase">{order.payment_method}</p>
                                </div>
                                {canCancelOrder(order.status) && (
                                    <button
                                        type="button"
                                        onClick={(event) => handleCancelOrder(event, order.id)}
                                        disabled={cancellingId === order.id}
                                        className="min-h-[40px] rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                )}
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
