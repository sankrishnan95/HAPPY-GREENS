import { Printer, Eye, Clock } from 'lucide-react';
import { getStatusColor, formatDateTime, formatCurrency } from '../utils/format';


export default function OrdersTable({ orders, onViewOrder, onPrintInvoice, onStatusUpdate }) {

  const handleStatusChange = (orderId, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return;

    const notes = prompt(`Update order #${orderId} to ${newStatus}.\nAdd notes (optional):`);
    if (notes !== null) { // User didn't cancel
      onStatusUpdate(orderId, newStatus, notes);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewOrder(order)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline">
                    #{order.id}
                  </div>
                  {order.items_count && (
                    <div className="text-xs text-gray-500">{order.items_count} items</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                  <div className="text-xs text-gray-500">{order.customer_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.payment_method && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 uppercase border">
                      {order.payment_method}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, order.status, e.target.value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer border-0 ${getStatusColor(order.status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="placed">Placed</option>
                    <option value="paid">Paid</option>
                    <option value="accepted">Accepted</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDateTime(order.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOrder(order);
                      }}
                      className="text-primary hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {['paid', 'delivered', 'placed', 'shipped'].includes(order.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrintInvoice(order.id);
                        }}
                        className="text-green-600 hover:text-green-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
