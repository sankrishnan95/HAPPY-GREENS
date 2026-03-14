import { useEffect, useState } from 'react';
import AnalyticsLayout from '../../components/analytics/AnalyticsLayout';
import MetricCard from '../../components/analytics/MetricCard';
import AnalyticsTable from '../../components/analytics/AnalyticsTable';
import { getInventoryInsights } from '../../services/analytics.service';

export default function InventoryInsights() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    metrics: { lowStockCount: 0, fastSellingCount: 0, slowMovingCount: 0 },
    lowStockItems: [],
    fastSellingProducts: [],
    slowMovingProducts: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await getInventoryInsights();
        setData(response.data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <AnalyticsLayout
      title="Inventory Insights"
      description="Spot low stock, fast movers, and products that need stocking decisions."
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard title="Low Stock Items" value={data.metrics.lowStockCount} helper="Stock below 10" tone="amber" />
            <MetricCard title="Fast Selling" value={data.metrics.fastSellingCount} helper="Products actively moving" tone="emerald" />
            <MetricCard title="Slow Moving" value={data.metrics.slowMovingCount} helper="Products with low movement" tone="slate" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AnalyticsTable
              columns={[
                { key: 'name', label: 'Low Stock Product' },
                { key: 'stock', label: 'Stock' },
              ]}
              rows={data.lowStockItems}
              emptyMessage="No low stock items right now."
            />

            <AnalyticsTable
              columns={[
                { key: 'name', label: 'Fast Selling Product' },
                { key: 'unitsSold', label: 'Units Sold' },
                { key: 'stock', label: 'Current Stock' },
              ]}
              rows={data.fastSellingProducts}
              emptyMessage="No fast selling products found yet."
            />
          </div>

          <AnalyticsTable
            columns={[
              { key: 'name', label: 'Slow Moving Product' },
              { key: 'unitsSold', label: 'Units Sold' },
              { key: 'stock', label: 'Current Stock' },
            ]}
            rows={data.slowMovingProducts}
            emptyMessage="No slow moving products found yet."
          />
        </>
      )}
    </AnalyticsLayout>
  );
}
