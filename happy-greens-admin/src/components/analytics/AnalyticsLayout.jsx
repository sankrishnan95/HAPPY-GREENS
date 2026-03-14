import { NavLink } from 'react-router-dom';

const analyticsTabs = [
  { to: '/analytics/sales', label: 'Sales Analytics' },
  { to: '/analytics/products', label: 'Product Analytics' },
  { to: '/analytics/customers', label: 'Customer Analytics' },
  { to: '/analytics/orders', label: 'Order Analytics' },
  { to: '/analytics/inventory', label: 'Inventory Insights' },
  { to: '/analytics/traffic', label: 'Traffic Analytics' },
];

export default function AnalyticsLayout({
  title,
  description,
  children,
  actions = null,
}) {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Analytics</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
            {description ? <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div> : null}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            {analyticsTabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
