import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AnalyticsLayout from '../../components/analytics/AnalyticsLayout';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import ChartTooltip from '../../components/analytics/ChartTooltip';
import AnalyticsTable from '../../components/analytics/AnalyticsTable';
import AnalyticsFilter from '../../components/AnalyticsFilter';
import AnalyticsRefreshButton from '../../components/AnalyticsRefreshButton';
import { getTrafficAnalytics } from '../../services/analytics.service';

export default function TrafficAnalytics() {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    metrics: {
      totalVisits: 0,
      productViews: 0,
      addToCart: 0,
      checkoutStarts: 0,
      checkoutConversionRate: 0,
      addToCartRate: 0,
    },
    visitsByDay: [],
    funnel: [],
    topPages: [],
  });

  const load = async (range, refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setLoading(true);
      const response = await getTrafficAnalytics(range);
      setData(response.data);
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
      title="Traffic Analytics"
      description="Real lightweight event tracking from storefront visits through order intent."
      actions={controls}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard title="Total Visits" value={data.metrics.totalVisits} helper="page_view events" tone="emerald" />
            <MetricCard title="Product Views" value={data.metrics.productViews} helper="Tracked product detail views" tone="blue" />
            <MetricCard title="Add To Cart" value={data.metrics.addToCart} helper="Cart intent signals" tone="amber" />
            <MetricCard title="Checkout Starts" value={data.metrics.checkoutStarts} helper="Checkout page entries" tone="violet" />
            <MetricCard title="Checkout Conversion" value={`${Number(data.metrics.checkoutConversionRate || 0).toFixed(1)}%`} helper="Orders vs visits" tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Visits Trend" description="Page views and product views over the last 30 days." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.visitsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="visits" name="Visits" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="productViews" name="Product Views" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Traffic Funnel" description="Movement from visits to product interest to cart intent and orders." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip content={<ChartTooltip />} />
                  <Funnel dataKey="value" data={data.funnel} isAnimationActive fill="#10b981">
                    <LabelList position="right" fill="#334155" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <AnalyticsTable
            columns={[
              { key: 'page', label: 'Page' },
              { key: 'visits', label: 'Visits' },
            ]}
            rows={data.topPages}
            emptyMessage="No tracked pages yet."
          />
        </>
      )}
    </AnalyticsLayout>
  );
}
