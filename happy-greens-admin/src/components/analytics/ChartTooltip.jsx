export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="text-sm font-medium text-slate-700">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}: {formatter ? formatter(item.value, item.name) : item.value}
          </p>
        ))}
      </div>
    </div>
  );
}
