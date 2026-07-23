"use client";

import { useMemo, useRef, useState } from "react";

type Point = { t: string; clicks: number };

export function ClicksChart({ series, range }: { series: Point[]; range: "24h" | "7d" | "30d" | "90d" }) {
  const width = 900;
  const height = 240;
  const padding = { top: 16, right: 12, bottom: 28, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const max = Math.max(1, ...series.map((p) => p.clicks));
  const niceMax = niceCeil(max);

  const points = useMemo(
    () =>
      series.map((p, i) => ({
        x: series.length > 1 ? (i / (series.length - 1)) * innerW : innerW,
        y: innerH - (p.clicks / niceMax) * innerH,
        ...p,
      })),
    [series, innerW, innerH, niceMax]
  );

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${innerH} L ${points[0].x} ${innerH} Z`
    : "";

  const yTicks = [0, 0.5, 1].map((f) => Math.round(niceMax * f));

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width - padding.left;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  const xLabels = pickXLabels(points, range);

  return (
    <div className="viz-root relative">
      <style>{`
        .viz-root {
          --series-1: #2a78d6;
          --grid: #e1e0d9;
          --text-muted: #898781;
          --surface-1: #fcfcfb;
        }
        @media (prefers-color-scheme: dark) {
          .viz-root {
            --series-1: #3987e5;
            --grid: #2c2c2a;
            --text-muted: #898781;
            --surface-1: #1a1a19;
          }
        }
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <g transform={`translate(${padding.left},${padding.top})`}>
          {yTicks.map((t, i) => {
            const y = innerH - (t / niceMax) * innerH;
            return (
              <g key={i}>
                <line x1={0} x2={innerW} y1={y} y2={y} stroke="var(--grid)" strokeWidth={1} />
                <text x={-8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--text-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatCompact(t)}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="var(--series-1)" opacity={0.1} stroke="none" />}
          {linePath && <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

          {points.length > 0 && (
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={5} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={2} />
          )}

          {hover && (
            <>
              <line x1={hover.x} x2={hover.x} y1={0} y2={innerH} stroke="var(--grid)" strokeWidth={1} />
              <circle cx={hover.x} cy={hover.y} r={5} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={2} />
            </>
          )}

          {xLabels.map(({ idx, label }) => (
            <text key={idx} x={points[idx]?.x ?? 0} y={innerH + 20} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
              {label}
            </text>
          ))}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          style={{
            left: `${((hover.x + padding.left) / width) * 100}%`,
            top: 8,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold tabular-nums">{hover.clicks.toLocaleString()} clicks</div>
          <div className="text-neutral-400">{formatTooltipDate(hover.t, range)}</div>
        </div>
      )}
    </div>
  );
}

function niceCeil(n: number) {
  if (n <= 10) return Math.ceil(n / 2) * 2 || 2;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const residual = n / magnitude;
  const step = residual > 5 ? 10 : residual > 2 ? 5 : 2;
  return Math.ceil(n / (step * magnitude)) * step * magnitude;
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: n >= 1000 ? "compact" : "standard" }).format(n);
}

function pickXLabels(points: { t: string }[], range: string) {
  if (points.length === 0) return [];
  const count = Math.min(5, points.length);
  const step = Math.max(1, Math.floor((points.length - 1) / (count - 1 || 1)));
  const labels: { idx: number; label: string }[] = [];
  for (let i = 0; i < points.length; i += step) {
    labels.push({ idx: i, label: formatAxisDate(points[i].t, range) });
  }
  return labels;
}

function formatAxisDate(iso: string, range: string) {
  const d = new Date(iso);
  if (range === "24h") return d.toLocaleTimeString("en-US", { hour: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipDate(iso: string, range: string) {
  const d = new Date(iso);
  if (range === "24h") return d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
