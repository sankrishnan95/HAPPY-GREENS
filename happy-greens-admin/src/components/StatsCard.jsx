export default function StatsCard({ title, value, icon: Icon, trend, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    secondary: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    info: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  };

  return (
    <div className="rounded-[12px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
          <p className="mt-3 text-[26px] font-bold leading-none text-slate-900 sm:text-[30px]">{value}</p>
          {trend ? (
            <p className="mt-3 text-sm leading-5 text-slate-500">{trend}</p>
          ) : null}
        </div>

        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${colorClasses[color] || colorClasses.primary}`}>
          <Icon className="h-7 w-7" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
