import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import AnalyticsLayout from '../../components/analytics/AnalyticsLayout';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import ChartTooltip from '../../components/analytics/ChartTooltip';
import AnalyticsFilter from '../../components/AnalyticsFilter';
import AnalyticsRefreshButton from '../../components/AnalyticsRefreshButton';
import { getDetailedCustomerAnalytics } from '../../services/analytics.service';

const PIE_COLORS = ['#10b981', '#6366f1'];
const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function CustomerAnalytics() {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    metrics: {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      averageSpendPerCustomer: 0,
      repeatPurchaseRate: 0,
    },
    newUsersByWeek: [],
    customerMix: [],
  });

  const load = async (range, refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setLoading(true);
      const response = await getDetailedCustomerAnalytics(range);
      setData(response?.data || data);
    } catch (error) {
      console.error('Customer analytics load failed:', error);
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
      title="Customer Analytics"
      description="Understand customer acquisition, retention, and spend behavior."
      actions={controls}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard title="Total Customers" value={data.metrics.totalCustomers} helper="Registered customer accounts" tone="emerald" />
            <MetricCard title="New Customers" value={data.metrics.newCustomers} helper="One purchase or less" tone="blue" />
            <MetricCard title="Returning Customers" value={data.metrics.returningCustomers} helper="More than one purchase" tone="violet" />
            <MetricCard title="Average Spend" value={formatCurrency(data.metrics.averageSpendPerCustomer)} helper="Per customer" tone="amber" />
            <MetricCard title="Repeat Purchase Rate" value={`${Number(data.metrics.repeatPurchaseRate || 0).toFixed(1)}%`} helper="Customers with repeat orders" tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="New Users per Week" description="Customer signups over the last 12 weeks." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.newUsersByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="newUsers" name="New users" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Customer Mix" description="New versus returning customers." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.customerMix} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                    {data.customerMix.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </AnalyticsLayout>
  );
}
