import { RefreshCcw } from 'lucide-react';

export default function AnalyticsRefreshButton({ onClick, loading = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span>{loading ? 'Recalculating...' : 'Refresh Analytics'}</span>
    </button>
  );
}
