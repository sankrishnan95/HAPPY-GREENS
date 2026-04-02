import { Menu, LogOut, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import NotificationBell from './NotificationBell';

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h2 className="text-[24px] font-bold leading-tight text-slate-900">Admin Panel</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your grocery store with cleaner, faster visibility.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative min-w-0 flex-1 sm:w-[260px] sm:flex-none lg:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders, products, customers"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <NotificationBell />

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-white shadow-[0_10px_24px_rgba(16,185,129,0.25)]">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Admin</p>
              <p className="text-xs text-slate-500">happygreens.com</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
