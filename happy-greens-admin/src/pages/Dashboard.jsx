import { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, AlertTriangle } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { getRevenueAnalytics, getOrdersAnalytics, getCustomerAnalytics, getProductAnalytics } from '../services/analytics.service';

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [revenueRes, ordersRes, customersRes, productsRes] = await Promise.all([
        getRevenueAnalytics(),
        getOrdersAnalytics(),
        getCustomerAnalytics(),
        getProductAnalytics(),
      ]);

      const todayRevenue = revenueRes.data.revenue_by_day?.[0]?.revenue || revenueRes.data.total_revenue || 0;
      const todayOrders = ordersRes.data.orders_by_day?.[0]?.count || ordersRes.data.total_orders || 0;
      const lowStockCount = productsRes.data.low_stock_products?.length || 0;

      setStats({
        revenue: todayRevenue,
        orders: todayOrders,
        customers: customersRes.data.total_customers || 0,
        lowStock: lowStockCount,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Happy Greens Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Today's Revenue"
          value={`₹${Number(stats.revenue).toFixed(2)}`}
          icon={DollarSign}
          color="primary"
          trend="Total revenue today"
        />
        <StatsCard
          title="Today's Orders"
          value={stats.orders}
          icon={ShoppingBag}
          color="secondary"
          trend="Orders placed today"
        />
        <StatsCard
          title="Total Customers"
          value={stats.customers}
          icon={Users}
          color="info"
          trend="Registered customers"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon={AlertTriangle}
          color="warning"
          trend="Items need reordering"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/orders"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <ShoppingBag className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-gray-900">Manage Orders</h3>
            <p className="text-sm text-gray-600 mt-1">View and process orders</p>
          </a>
          <a
            href="/products"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <AlertTriangle className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Check Inventory</h3>
            <p className="text-sm text-gray-600 mt-1">Monitor stock levels</p>
          </a>
          <a
            href="/reports"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">View Reports</h3>
            <p className="text-sm text-gray-600 mt-1">Analytics and insights</p>
          </a>
        </div>
      </div>
    </div>
  );
}
