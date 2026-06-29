import { useState } from 'react';
import { KeyRound, LogOut, Menu, Search, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import NotificationBell from './NotificationBell';
import { changePassword } from '../services/auth.service';

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const resetPasswordModal = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordSaving(false);
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('Password changed. Please login again.');
      window.setTimeout(() => {
        removeToken();
        navigate('/login', { replace: true });
      }, 900);
    } catch (error) {
      setPasswordError(error?.response?.data?.message || 'Failed to change password.');
      setPasswordSaving(false);
    }
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
            type="button"
            onClick={() => {
              resetPasswordModal();
              setPasswordModalOpen(true);
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            <KeyRound className="h-4 w-4" />
            Change Password
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {passwordModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Change admin password</p>
                <p className="mt-1 text-xs text-slate-500">Use a strong password. You will login again after saving.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetPasswordModal();
                  setPasswordModalOpen(false);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 p-5">
              {passwordError ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {passwordError}
                </div>
              ) : null}

              {passwordSuccess ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  {passwordSuccess}
                </div>
              ) : null}

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Current password</span>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">New password</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  minLength={8}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Confirm new password</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  minLength={8}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? 'Saving...' : 'Save new password'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </header>
  );
}
