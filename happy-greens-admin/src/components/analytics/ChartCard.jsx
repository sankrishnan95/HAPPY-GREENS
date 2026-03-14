export default function ChartCard({ title, description, children, loading = false }) {
  return (
    <section className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="relative h-[280px] w-full sm:h-[320px]">
        <div className={loading ? 'opacity-45 transition-opacity duration-200' : 'transition-opacity duration-200'}>{children}</div>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/55 backdrop-blur-[1px]">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
