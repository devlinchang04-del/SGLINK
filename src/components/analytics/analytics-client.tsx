"use client";

import { useEffect, useState } from "react";
import { ClicksChart } from "@/components/analytics/clicks-chart";
import { TopList } from "@/components/analytics/top-list";
import { shortUrlFor } from "@/lib/domains";
import { formatNumber } from "@/lib/utils";

type Range = "24h" | "7d" | "30d" | "90d";

type AnalyticsData = {
  series: { t: string; clicks: number }[];
  totalClicks: number;
  topReferrers: { label: string; clicks: number }[];
  topCountries: { label: string; clicks: number }[];
  topDevices: { label: string; clicks: number }[];
  topLinks: { id: string; key: string; domain: string | null; title: string | null; clicks: number }[];
};

const RANGE_LABELS: Record<Range, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export function AnalyticsClient({ workspaceSlug, linkId }: { workspaceSlug: string; linkId?: string }) {
  const [range, setRange] = useState<Range>("24h");
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ range, ...(linkId ? { linkId } : {}) });
    fetch(`/api/w/${workspaceSlug}/analytics?${qs}`)
      .then((r) => r.json())
      .then(setData);
  }, [workspaceSlug, range, linkId]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="flex rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-800">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                range === r ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 opacity-100 transition-opacity dark:border-neutral-800" style={{ opacity: data ? 1 : 0.5 }}>
        <div className="border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">Clicks</p>
          <p className="text-3xl font-semibold tabular-nums">{formatNumber(data?.totalClicks ?? 0)}</p>
        </div>
        <div className="p-4">
          <ClicksChart series={data?.series ?? []} range={range} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TopList title="Top links" rows={(data?.topLinks ?? []).map((l) => ({ label: l.title || shortUrlFor(l.domain, l.key), clicks: l.clicks }))} />
        <TopList title="Referrers" rows={data?.topReferrers ?? []} />
        <TopList title="Countries" rows={data?.topCountries ?? []} />
        <TopList title="Devices" rows={data?.topDevices ?? []} />
      </div>
    </div>
  );
}
