import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, DollarSign, Package, ShoppingBag, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatsCard from '../components/StatsCard';
import { getCustomerAnalytics, getDashboardAnalytics, getOrdersAnalytics, getProductAnalytics } from '../services/analytics.service';
import { getOrders } from '../services/order.service';

const quickActions = [
  {
    to: '/orders',
    title: 'Manage Orders',
    description: 'Review incoming orders and update fulfilment quickly.',
    icon: ShoppingBag,
    tone: 'from-emerald-500 to-lime-400',
  },
  {
    to: '/products',
    title: 'Check Inventory',
    description: 'See stock gaps, edit products, and reorder low items.',
    icon: Package,
    tone: 'from-amber-500 to-orange-400',
  },
  {
    to: '/analytics/sales',
    title: 'View Reports',
    description: 'Open analytics for revenue, products, customers, and traffic.',
    icon: DollarSign,
    tone: 'from-sky-500 to-indigo-500',
  },
];

const metricCards = [
  {
    to: '/analytics/sales',
    title: "Today's Revenue",
    statKey: 'revenue',
    icon: DollarSign,
    color: 'primary',
    trend: 'Total revenue collected today',
    format: (value) => formatCurrency(value),
  },
  {
    to: '/orders',
    title: "Today's Orders",
    statKey: 'orders',
    icon: ShoppingBag,
    color: 'secondary',
    trend: 'Orders placed since midnight',
    format: (value) => value,
  },
  {
    to: '/customers',
    title: 'Total Customers',
    statKey: 'customers',
    icon: Users,
    color: 'info',
    trend: 'Registered customers in the store',
    format: (value) => value,
  },
  {
    to: '/products',
    title: 'Low Stock Items',
    statKey: 'lowStock',
    icon: AlertTriangle,
    color: 'warning',
    trend: 'Products that need replenishment',
    format: (value) => value,
  },
];

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    lowStock: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [statusSummary, setStatusSummary] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [dashboardRes, customersRes, productsRes, ordersAnalyticsRes, recentOrdersRes] = await Promise.all([
          getDashboardAnalytics('7'),
          getCustomerAnalytics(),
          getProductAnalytics(),
          getOrdersAnalytics(),
          getOrders('all'),
        ]);

        const todayRevenue = dashboardRes.data.metrics?.todayRevenue || 0;
        const todayOrders = dashboardRes.data.metrics?.todayOrders || 0;
        const lowStockCount = productsRes.data.low_stock_products?.length || 0;

        setStats({
          revenue: todayRevenue,
          orders: todayOrders,
          customers: customersRes.data.total_customers || 0,
          lowStock: lowStockCount,
        });

        setChartData(dashboardRes.data.chartData || []);
        setStatusSummary((ordersAnalyticsRes.data.orders_by_status || []).slice(0, 5));
        setRecentOrders((recentOrdersRes.data || []).slice(0, 6));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const activityCards = useMemo(() => {
    const totalTracked = statusSummary.reduce((sum, item) => sum + Number(item.count || 0), 0) || 1;
    return statusSummary.map((item) => ({
      ...item,
      share: ((Number(item.count || 0) / totalTracked) * 100).toFixed(1),
    }));
  }, [statusSummary]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[18px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_20px_45px_rgba(15,23,42,0.06)] sm:px-7 sm:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Overview</p>
            <h1 className="mt-2 text-[24px] font-bold leading-tight text-slate-900">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Monitor revenue, order flow, customers, and inventory health from one place.</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
            Updated with today's revenue, orders, and stock pressure.
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Link key={card.title} to={card.to} className="block">
            <StatsCard
              title={card.title}
              value={card.format(stats[card.statKey])}
              icon={card.icon}
              color={card.color}
              trend={card.trend}
            />
          </Link>
        ))}
      </section>

      <section className="rounded-[18px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">Jump into the most common admin tasks.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group rounded-[16px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${action.tone} text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]`}>
                <action.icon className="h-7 w-7" />
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-emerald-600" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[18px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">Revenue Trend</h2>
              <p className="mt-1 text-sm text-slate-500">Revenue and order momentum over the selected dashboard range.</p>
            </div>
          </div>

          <div className="h-[300px] w-full sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs. ${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 16, borderColor: '#dbe4dd', boxShadow: '0 16px 32px rgba(15,23,42,0.08)' }}
                  formatter={(value, name) => [name === 'sales' ? formatCurrency(value) : value, name === 'sales' ? 'Revenue' : 'Orders']}
                />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fill="url(#dashboardRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[18px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-5">
            <h2 className="text-[18px] font-bold text-slate-900">Activity Summary</h2>
            <p className="mt-1 text-sm text-slate-500">Order status mix across the current data set.</p>
          </div>

          <div className="space-y-4">
            {activityCards.map((item) => (
              <Link key={item.status} to="/orders" className="block rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50/60 hover:ring-emerald-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-900">{item.status}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.share}% of tracked orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{item.count}</p>
                    <p className="text-xs text-slate-500">orders</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" style={{ width: `${Math.max(Number(item.share), 8)}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[18px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">Recent Orders</h2>
              <p className="mt-1 text-sm text-slate-500">Latest customer activity coming into the store.</p>
            </div>
            <Link to="/orders" className="text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800">View all</Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 px-4 py-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/40 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Order #{order.id}</p>
                  <p className="mt-1 text-sm text-slate-500">{order.customer_name || order.customer_email || 'Customer'} • {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{order.status}</span>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-5">
            <h2 className="text-[18px] font-bold text-slate-900">Team Pulse</h2>
            <p className="mt-1 text-sm text-slate-500">A quick read of what needs attention today.</p>
          </div>

          <div className="space-y-4">
            <Link to="/analytics/sales" className="block rounded-2xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(16,185,129,0.08)]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Revenue</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">Today's revenue is {formatCurrency(stats.revenue)} with {stats.orders} orders already placed.</p>
            </Link>
            <Link to="/products" className="block rounded-2xl bg-amber-50 px-4 py-4 ring-1 ring-amber-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(245,158,11,0.08)]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-amber-700">Inventory</p>
              <p className="mt-2 text-sm leading-6 text-amber-900">{stats.lowStock} items are low on stock and may need replenishment.</p>
            </Link>
            <Link to="/customers" className="block rounded-2xl bg-sky-50 px-4 py-4 ring-1 ring-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(14,165,233,0.08)]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-sky-700">Customers</p>
              <p className="mt-2 text-sm leading-6 text-sky-900">Customer base stands at {stats.customers}, giving a good view of repeat demand potential.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
