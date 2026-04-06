import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Truck, Tag, BarChart3, Image as ImageIcon, Users, FolderTree } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  {
    to: '/analytics/sales',
    icon: BarChart3,
    label: 'Analytics',
    children: [
      { to: '/analytics/sales', label: 'Sales Analytics' },
      { to: '/analytics/products', label: 'Product Analytics' },
      { to: '/analytics/customers', label: 'Customer Analytics' },
      { to: '/analytics/orders', label: 'Order Analytics' },
      { to: '/analytics/inventory', label: 'Inventory Insights' },
      { to: '/analytics/traffic', label: 'Traffic Analytics' },
    ],
  },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  {
    to: '/products',
    icon: Package,
    label: 'Products & Inventory',
    children: [
      { to: '/products', label: 'All Products' },
      { to: '/categories', label: 'Categories' },
    ],
  },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/deliveries', icon: Truck, label: 'Deliveries' },
  { to: '/discounts', icon: Tag, label: 'Discounts' },
  { to: '/banners', icon: ImageIcon, label: 'Banners' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="admin-sidebar-gradient relative flex h-full w-[280px] flex-col overflow-hidden border-r border-white/10 text-white shadow-[0_20px_50px_rgba(7,24,18,0.22)] lg:h-screen lg:w-[288px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="relative border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10 p-1 ring-1 ring-white/10 backdrop-blur-sm">
            <img
              src="/logo.png"
              alt="Happy Greens"
              className="h-full w-full rounded-[14px] object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Happy Greens</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-100/70">Admin Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-scroll-hidden relative flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const isParentActive = item.children?.some((child) => location.pathname === child.to || location.pathname.startsWith(child.to + '/')) || false;

            return (
              <li key={item.to}>
                {index === 1 ? <div className="mb-4 mt-2 border-t border-white/10" /> : null}
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `group flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${isActive || isParentActive
                      ? 'bg-white text-emerald-900 font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.1)]'
                      : 'text-white/88 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-[22px] w-[22px] flex-shrink-0" strokeWidth={1.9} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>

                {item.children ? (
                  <ul className="mt-3 space-y-1 border-l border-white/10 pl-4">
                    {item.children.map((child) => (
                      <li key={child.to}>
                        <NavLink
                          to={child.to}
                          className={({ isActive }) =>
                            `block rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${isActive
                              ? 'bg-white/16 text-white'
                              : 'text-white/72 hover:bg-white/8 hover:text-white'
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative border-t border-white/10 px-6 py-5">
        <div className="rounded-2xl bg-white/6 px-4 py-3 ring-1 ring-white/8 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">Workspace</p>
          <p className="mt-2 text-sm font-medium text-white/90">Store operations, analytics, and fulfillment.</p>
        </div>
      </div>
    </aside>
  );
}
