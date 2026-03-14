import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AnalyticsLayout from '../../components/analytics/AnalyticsLayout';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import ChartTooltip from '../../components/analytics/ChartTooltip';
import AnalyticsTable from '../../components/analytics/AnalyticsTable';
import AnalyticsFilter from '../../components/AnalyticsFilter';
import AnalyticsRefreshButton from '../../components/AnalyticsRefreshButton';
import { getDetailedOrderAnalytics } from '../../services/analytics.service';

export default function OrderAnalytics() {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    metrics: {
      totalOrders: 0,
      cancelledOrders: 0,
      ordersToday: 0,
      averageOrderValue: 0,
      peakOrderHours: [],
    },
    ordersByStatus: [],
    ordersByDay: [],
    ordersByHour: [],
  });

  const load = async (range, refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setLoading(true);
      const response = await getDetailedOrderAnalytics(range);
      setData(response?.data || data);
    } catch (error) {
      console.error('Order analytics load failed:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load(selectedRange);
  }, [selectedRange]);

  const handleRefresh = async () => {
    if (!window.confirm('Recalculate analytics from the selected time range?')) return;
    await load(selectedRange, true);
  };

  const controls = (
    <>
      <AnalyticsFilter value={selectedRange} onChange={setSelectedRange} disabled={loading || isRefreshing} />
      <AnalyticsRefreshButton onClick={handleRefresh} loading={isRefreshing} disabled={loading || isRefreshing} />
    </>
  );

  return (
    <AnalyticsLayout
      title="Order Analytics"
      description="Track operational load, status mix, and peak order timings."
      actions={controls}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Total Orders" value={data.metrics.totalOrders} helper="All recorded orders" tone="emerald" />
            <MetricCard title="Orders Today" value={data.metrics.ordersToday} helper="Placed today" tone="blue" />
            <MetricCard title="Cancelled Orders" value={data.metrics.cancelledOrders} helper="Needs review" tone="rose" />
            <MetricCard title="Peak Hour" value={data.metrics.peakOrderHours[0]?.hour || 'N/A'} helper={data.metrics.peakOrderHours[0] ? `${data.metrics.peakOrderHours[0].orders} orders` : 'No peak data'} tone="amber" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Orders Timeline" description="Daily order volume over the last 30 days." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#0f766e" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Orders by Hour" description="When order activity peaks through the day." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ordersByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} interval={1} angle={-35} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <AnalyticsTable
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'count', label: 'Orders' },
            ]}
            rows={data.ordersByStatus}
          />
        </>
      )}
    </AnalyticsLayout>
  );
}
