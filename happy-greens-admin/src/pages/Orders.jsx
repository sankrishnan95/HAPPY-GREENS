import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrdersTable from '../components/OrdersTable';
import { getOrders, updateOrderStatus, getInvoiceUrl } from '../services/order.service';

const STATUS_TABS = [
  { label: 'All', value: 'all', color: 'gray' },
  { label: 'Pending', value: 'pending', color: 'yellow' },
  { label: 'Placed (COD)', value: 'placed', color: 'orange' },
  { label: 'Accepted', value: 'accepted', color: 'blue' },
  { label: 'Shipped', value: 'shipped', color: 'purple' },
  { label: 'Delivered', value: 'delivered', color: 'green' },
  { label: 'Cancelled', value: 'cancelled', color: 'red' },
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading orders with status:', activeTab);
      const response = await getOrders(activeTab);
      console.log('✅ Orders loaded:', response.data.length);
      setOrders(response.data || []);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toString().includes(searchTerm) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId, newStatus, notes = '') => {
    try {
      console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
      await updateOrderStatus(orderId, newStatus, notes);
      console.log('✅ Order status updated');
      loadOrders();
      alert(`Order #${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleViewOrder = (order) => {
    navigate(`/orders/${order.id}`);
  };

  const handlePrintInvoice = async (orderId) => {
    try {
      console.log('🖨️ Printing invoice for order:', orderId);
      const url = getInvoiceUrl(orderId, 'a4');
      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to fetch invoice');

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
      console.error('❌ Error printing invoice:', error);
      alert('Failed to print invoice');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            onStatusUpdate={handleStatusUpdate}
            onViewOrder={handleViewOrder}
            onPrintInvoice={handlePrintInvoice}
          />
        )}
      </div>
    </div>
  );
}
