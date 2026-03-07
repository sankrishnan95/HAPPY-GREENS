import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Users, AlertTriangle } from 'lucide-react';
import { getRevenueAnalytics, getProductAnalytics, getCustomerAnalytics } from '../services/analytics.service';

const COLORS = ['#2d5016', '#4ade80', '#fb923c', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const [revenueRes, productsRes, customersRes] = await Promise.all([
        getRevenueAnalytics(),
        getProductAnalytics(),
        getCustomerAnalytics(),
      ]);

      const revenueByDay = (revenueRes.data.revenue_by_day || [])
        .slice(0, 30)
        .reverse()
        .map(item => ({
          date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: parseFloat(item.revenue),
        }));

      const topProds = (productsRes.data.top_products_by_revenue || [])
        .slice(0, 10)
        .map(p => ({
          name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
          revenue: parseFloat(p.total_revenue),
        }));

      const topCusts = (customersRes.data.top_customers || [])
        .slice(0, 10);

      const lowStock = (productsRes.data.low_stock_products || []);

      const categoryPerf = {};
      (productsRes.data.category_performance || []).forEach(cat => {
        categoryPerf[cat.category_name] = parseFloat(cat.total_revenue);
      });

      const catData = Object.entries(categoryPerf).map(([name, value]) => ({
        name,
        value,
      }));

      setRevenueData(revenueByDay);
      setTopProducts(topProds);
      setTopCustomers(topCusts);
      setLowStockProducts(lowStock);
      setCategoryData(catData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Business insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Revenue Trend (Last 30 Days)</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2d5016" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Top Products by Revenue</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#2d5016" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Category Performance</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Top Customers</h2>
          </div>
          <div className="overflow-auto max-h-[300px]">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topCustomers.map((customer, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{customer.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{customer.total_orders}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(customer.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Low Stock Alerts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowStockProducts.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Low Stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lowStockProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No low stock items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
