import { useState, useEffect } from 'react';
import { Search, Truck, Package, MapPin, Clock, Plus } from 'lucide-react';
import { getDeliveries, updateDeliveryStatus } from '../services/delivery.service';
import { getStatusColor, formatDateTime, formatCurrency } from '../utils/format';
const DELIVERY_TABS = [
  { label: 'All', value: 'all', color: 'gray' },
  { label: 'Pickup Pending', value: 'pickup_pending', color: 'yellow' },
  { label: 'In Transit', value: 'in_transit', color: 'blue' },
  { label: 'Out for Delivery', value: 'out_for_delivery', color: 'purple' },
  { label: 'Delivered', value: 'delivered', color: 'green' },
  { label: 'RTO', value: 'rto', color: 'orange' },
  { label: 'Lost', value: 'lost', color: 'red' },
];



export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadDeliveries();
  }, [activeTab]);

  useEffect(() => {
    filterDeliveries();
  }, [searchTerm, deliveries]);

  const loadDeliveries = async () => {
    try {
      console.log('🔄 Loading deliveries with status:', activeTab);

      const response = await getDeliveries(activeTab);

      console.log('✅ Deliveries loaded:', response.data.length);
      setDeliveries(response.data || []);
    } catch (error) {
      console.error('❌ Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDeliveries = () => {
    let filtered = deliveries;

    if (searchTerm) {
      filtered = filtered.filter(delivery =>
        delivery.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.order_number?.toString().includes(searchTerm)
      );
    }

    setFilteredDeliveries(filtered);
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    const notes = prompt(`Update delivery to ${newStatus}.\nAdd notes (optional):`);
    if (notes === null) return; // User cancelled

    try {
      console.log(`🔄 Updating delivery ${deliveryId} to ${newStatus}`);

      const response = await updateDeliveryStatus(deliveryId, newStatus, notes);

      console.log('✅ Delivery status updated:', response.data);
      loadDeliveries();
      alert(`Delivery status updated to ${newStatus}`);
    } catch (error) {
      console.error('❌ Error updating delivery status:', error);
      alert('Failed to update delivery status');
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Control Center</h1>
          <p className="text-gray-600 mt-2">Track and manage deliveries</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {DELIVERY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
                {activeTab === tab.value && deliveries.length > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-primary text-white">
                    {deliveries.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tracking number, customer name, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimated Delivery
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-primary mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.tracking_number}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {delivery.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Order #{delivery.order_number}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(delivery.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {delivery.customer_name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {delivery.delivery_address?.substring(0, 30)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Truck className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">
                        {delivery.courier_name || 'Not assigned'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={delivery.delivery_status}
                      onChange={(e) => handleStatusUpdate(delivery.id, e.target.value)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer border-0 ${getStatusColor(delivery.delivery_status)}`}
                    >
                      <option value="pickup_pending">Pickup Pending</option>
                      <option value="in_transit">In Transit</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="rto">RTO</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDateTime(delivery.estimated_delivery)}
                    </div>
                    {delivery.actual_delivery && (
                      <div className="text-xs text-green-600 mt-1">
                        Delivered: {formatDateTime(delivery.actual_delivery)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow mt-6">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No deliveries found</p>
          <p className="text-sm text-gray-400 mt-2">
            {activeTab !== 'all' ? `No ${activeTab.replace('_', ' ')} deliveries` : 'Try adjusting your search'}
          </p>
        </div>
      )}
    </div>
  );
}
