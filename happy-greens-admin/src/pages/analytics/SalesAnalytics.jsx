import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AnalyticsLayout from '../../components/analytics/AnalyticsLayout';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import ChartTooltip from '../../components/analytics/ChartTooltip';
import AnalyticsFilter from '../../components/AnalyticsFilter';
import AnalyticsRefreshButton from '../../components/AnalyticsRefreshButton';
import { getSalesAnalytics } from '../../services/analytics.service';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function SalesAnalytics() {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    metrics: {
      totalRevenue: 0,
      ordersToday: 0,
      ordersThisWeek: 0,
      ordersThisMonth: 0,
      averageOrderValue: 0,
      revenueGrowth: 0,
    },
    revenueByDay: [],
    revenueByCategory: [],
  });

  const fetchData = async (range, refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setLoading(true);
      const response = await getSalesAnalytics(range);
      setData(response?.data || data);
    } catch (error) {
      console.error('Sales analytics load failed:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(selectedRange);
  }, [selectedRange]);

  const handleRefresh = async () => {
    if (!window.confirm('Recalculate analytics from the selected time range?')) return;
    await fetchData(selectedRange, true);
  };

  const controls = (
    <>
      <AnalyticsFilter value={selectedRange} onChange={setSelectedRange} disabled={loading || isRefreshing} />
      <AnalyticsRefreshButton onClick={handleRefresh} loading={isRefreshing} disabled={loading} />
    </>
  );

  return (
    <AnalyticsLayout
      title="Analytics Dashboard"
      description="Revenue, order velocity, and category contribution in one view."
      actions={controls}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard title="Total Revenue" value={formatCurrency(data.metrics.totalRevenue)} helper="All non-cancelled orders" tone="emerald" />
            <MetricCard title="Orders Today" value={data.metrics.ordersToday} helper="Placed since midnight" tone="blue" />
            <MetricCard title="Orders This Week" value={data.metrics.ordersThisWeek} helper="From the selected range" tone="amber" />
            <MetricCard title="Orders This Month" value={data.metrics.ordersThisMonth} helper="Volume inside the selected range" tone="violet" />
            <MetricCard title="Average Order Value" value={formatCurrency(data.metrics.averageOrderValue)} helper="Average basket size" tone="slate" />
            <MetricCard title="Revenue Growth" value={`${Number(data.metrics.revenueGrowth || 0).toFixed(1)}%`} helper="Compared against the previous period" tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Revenue by Day" description="Daily revenue for the selected period." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `Rs. ${value}`} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Orders by Day" description="Daily order count for the same period." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="orders" name="Orders" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Revenue by Category" description="Which categories contribute the most revenue." loading={isRefreshing}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByCategory} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(value) => `Rs. ${value}`} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </AnalyticsLayout>
  );
}
