type Row = { label: string; clicks: number };

export function TopList({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.clicks));

  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-neutral-400">No data yet</p>}
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="relative flex items-center justify-between overflow-hidden rounded-md px-2 py-1.5 text-sm">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--series-1,#2a78d6)] opacity-10"
              style={{ width: `${(row.clicks / max) * 100}%` }}
            />
            <span className="relative truncate">{row.label}</span>
            <span className="relative shrink-0 pl-2 font-medium tabular-nums">{row.clicks.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
