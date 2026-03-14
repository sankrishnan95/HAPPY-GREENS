import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AnalyticsLayout from '../../components/analytics/AnalyticsLayout';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import ChartTooltip from '../../components/analytics/ChartTooltip';
import AnalyticsTable from '../../components/analytics/AnalyticsTable';
import AnalyticsFilter from '../../components/AnalyticsFilter';
import AnalyticsRefreshButton from '../../components/AnalyticsRefreshButton';
import { getDetailedProductAnalytics } from '../../services/analytics.service';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function ProductAnalytics() {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    metrics: {
      topSellingProducts: [],
      lowPerformingProducts: [],
      revenuePerProduct: [],
      inventoryLevels: { lowStockCount: 0, outOfStockCount: 0, activeProducts: 0 },
    },
    topSelling: [],
    table: [],
  });

  const load = async (range, refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setLoading(true);
      const response = await getDetailedProductAnalytics(range);
      setData(response?.data || data);
    } catch (error) {
      console.error('Product analytics load failed:', error);
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
      title="Product Analytics"
      description="Measure product demand, stock pressure, and revenue contribution."
      actions={controls}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Active Products" value={data.metrics.inventoryLevels.activeProducts} helper="Tracked in analytics" tone="emerald" />
            <MetricCard title="Low Stock Items" value={data.metrics.inventoryLevels.lowStockCount} helper="Stock below 10" tone="amber" />
            <MetricCard title="Out of Stock" value={data.metrics.inventoryLevels.outOfStockCount} helper="Requires replenishment" tone="rose" />
            <MetricCard title="Top Seller" value={data.topSelling[0]?.name || 'N/A'} helper={data.topSelling[0] ? `${data.topSelling[0].unitsSold} units sold` : 'No orders yet'} tone="blue" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Revenue per Product" description="Top products by revenue contribution." loading={isRefreshing}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.metrics.revenuePerProduct} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={(value) => `Rs. ${value}`} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Low Performing Products</h2>
              <p className="mt-1 text-sm text-slate-500">Products with the fewest sold units.</p>
              <div className="mt-4 space-y-3">
                {data.metrics.lowPerformingProducts.map((product) => (
                  <div key={product.productId} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.unitsSold} units sold</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{formatCurrency(product.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AnalyticsTable
            columns={[
              { key: 'name', label: 'Product' },
              { key: 'orders', label: 'Orders' },
              { key: 'revenue', label: 'Revenue', render: (value) => formatCurrency(value) },
              { key: 'stock', label: 'Stock' },
              {
                key: 'status',
                label: 'Status',
                render: (value) => (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : value === 'Low stock' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {value}
                  </span>
                ),
              },
            ]}
            rows={data.table}
          />
        </>
      )}
    </AnalyticsLayout>
  );
}
