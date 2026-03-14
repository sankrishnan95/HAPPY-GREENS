import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Truck, Tag, BarChart3, Leaf, Image as ImageIcon, Users } from 'lucide-react';

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
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/deliveries', icon: Truck, label: 'Deliveries' },
  { to: '/discounts', icon: Tag, label: 'Discounts' },
  { to: '/banners', icon: ImageIcon, label: 'Banners' },
];

export default function Sidebar() {
  return (
    <aside className="w-full bg-primary text-white lg:w-72 lg:flex-shrink-0">
      <div className="flex items-center gap-3 border-b border-primary-700 px-4 py-4 sm:px-6">
        <Leaf className="h-7 w-7 sm:h-8 sm:w-8" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold sm:text-xl">Happy Greens</h1>
          <p className="text-xs text-primary-200">Admin Dashboard</p>
        </div>
      </div>

      <nav className="overflow-x-auto px-3 py-3 custom-scrollbar lg:flex-1 lg:px-4">
        <ul className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col lg:space-y-2 lg:gap-0">
          {navItems.map((item) => (
            <li key={item.to} className="lg:w-full">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 whitespace-nowrap transition-colors ${isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-100 hover:bg-primary-700/50'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>

              {item.children ? (
                <ul className="mt-2 flex min-w-max gap-2 pl-2 lg:min-w-0 lg:flex-col lg:gap-1 lg:pl-12">
                  {item.children.map((child) => (
                    <li key={child.to}>
                      <NavLink
                        to={child.to}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${isActive
                            ? 'bg-primary-800 text-white'
                            : 'text-primary-200 hover:bg-primary-700/40 hover:text-white'
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
          ))}
        </ul>
      </nav>

      <div className="hidden border-t border-primary-700 p-4 lg:block">
        <p className="text-center text-xs text-primary-200">
          © 2026 Happy Greens
        </p>
      </div>
    </aside>
  );
}
