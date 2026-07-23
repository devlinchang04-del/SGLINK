type Row = { label: string; clicks: number };

const DOT_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TopList({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.clicks));

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">Clicks</span>
      </div>
      <div className="p-2">
        {rows.length === 0 && <p className="px-2 py-4 text-sm text-neutral-400">No data yet</p>}
        {rows.map((row, i) => {
          const color = DOT_COLORS[i % DOT_COLORS.length];
          return (
            <div key={row.label} className="relative flex items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-sm">
              <div className="absolute inset-y-0 left-0" style={{ width: `${(row.clicks / max) * 100}%`, backgroundColor: hexToRgba(color, 0.08) }} />
              <span className="relative h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="relative flex-1 truncate">{row.label}</span>
              <span className="relative shrink-0 pl-2 font-medium tabular-nums">{row.clicks.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
