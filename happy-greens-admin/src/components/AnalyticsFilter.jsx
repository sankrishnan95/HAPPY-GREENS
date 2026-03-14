import { CalendarDays, ChevronDown } from 'lucide-react';

export const ANALYTICS_RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export default function AnalyticsFilter({ value, onChange, disabled = false }) {
  return (
    <label className="inline-flex min-h-[44px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:border-emerald-200 sm:w-auto">
      <CalendarDays className="h-4 w-4 text-slate-400" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-h-0 appearance-none bg-transparent pr-6 font-semibold text-slate-800 outline-none disabled:cursor-not-allowed"
      >
        {ANALYTICS_RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-4 w-4 text-slate-400" />
    </label>
  );
}
