import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag, CreditCard, Clock, CheckCircle, Package } from 'lucide-react';
import { getCustomerById } from '../services/customer.service';
import { getOrders } from '../services/order.service';
import toast from 'react-hot-toast';
import { getStatusColor, formatDate, formatCurrency } from '../utils/format';


export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomerData();
    }, [id]);

    const fetchCustomerData = async () => {
        try {
            setLoading(true);
            const [customerRes, ordersRes] = await Promise.all([
                getCustomerById(id),
                getOrders('all', { customerId: id })
            ]);
            setCustomer(customerRes.data);
            setOrders(ordersRes.data);
        } catch (error) {
            console.error('Failed to load customer details:', error);
            toast.error('Customer not found');
            navigate('/customers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/customers')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">ID: #{customer.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Information Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1 h-fit">
                    <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-4xl font-bold mb-4 shadow-inner">
                            {customer.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{customer.name || 'Unnamed Customer'}</h2>
                        <p className="text-sm text-gray-500 mt-1">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="pt-6 space-y-4">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <a href={`mailto:${customer.email}`} className="hover:text-primary-600">{customer.email}</a>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <a href={`tel:${customer.phone}`} className="hover:text-primary-600">{customer.phone || 'No phone provided'}</a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-gray-100">
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                            <p className="text-xl font-bold text-gray-900">{customer.total_orders}</p>
                        </div>
                        <div className="bg-primary-50 rounded-xl p-4 text-center">
                            <p className="text-sm text-primary-600 mb-1">Total Spent</p>
                            <p className="text-xl font-bold text-primary-700">{formatCurrency(customer.total_spent)}</p>
                        </div>
                    </div>

                    {/* Loyalty Points */}
                    <div className="pt-6 mt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                            ⭐ Loyalty Points
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-yellow-50 rounded-xl p-3">
                                <p className="text-xs text-yellow-600 mb-1">Available</p>
                                <p className="text-lg font-bold text-yellow-700">{customer.loyalty_points ?? 0}</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3">
                                <p className="text-xs text-green-600 mb-1">Earned</p>
                                <p className="text-lg font-bold text-green-700">{customer.total_points_earned ?? 0}</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3">
                                <p className="text-xs text-red-500 mb-1">Redeemed</p>
                                <p className="text-lg font-bold text-red-600">{customer.total_points_redeemed ?? 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order History Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary-600" />
                            Order History
                        </h2>
                        <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-xs font-semibold">
                            {orders.length} orders found
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-sm border-b border-gray-100">
                                    <th className="px-6 py-4 font-semibold text-gray-600">Order ID</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Items</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Total</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p>This customer hasn't placed any orders yet.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                            <td className="px-6 py-4 font-medium text-primary-600 hover:text-primary-800 hover:underline">#{order.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{order.items_count} items</td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(order.total_amount)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
