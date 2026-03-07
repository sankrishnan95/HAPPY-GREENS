import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Truck, Tag, BarChart3, Leaf, Image as ImageIcon, Users } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/deliveries', icon: Truck, label: 'Deliveries' },
  { to: '/discounts', icon: Tag, label: 'Discounts' },
  { to: '/banners', icon: ImageIcon, label: 'Banners' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-primary text-white flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-primary-700">
        <Leaf className="w-8 h-8" />
        <div>
          <h1 className="text-xl font-bold">Happy Greens</h1>
          <p className="text-xs text-primary-200">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-100 hover:bg-primary-700/50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-primary-700">
        <p className="text-xs text-primary-200 text-center">
          © 2026 Happy Greens
        </p>
      </div>
    </div>
  );
}
