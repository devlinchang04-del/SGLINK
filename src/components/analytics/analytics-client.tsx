"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
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

export function AnalyticsClient({
  workspaceSlug,
  linkId,
  linkLabel,
}: {
  workspaceSlug: string;
  linkId?: string;
  linkLabel?: string | null;
}) {
  const router = useRouter();
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

      {linkId && linkLabel && (
        <div className="mb-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 py-1 pl-3 pr-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-neutral-400">Link is</span>
            <span className="font-medium">{linkLabel}</span>
            <button
              onClick={() => router.push(`/${workspaceSlug}/analytics`)}
              className="rounded-full p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-800"
              title="Clear filter"
            >
              <X size={13} />
            </button>
          </span>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 opacity-100 transition-opacity dark:border-neutral-800" style={{ opacity: data ? 1 : 0.5 }}>
        <div className="border-b-2 border-neutral-900 px-6 py-3 dark:border-white">
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <span className="h-2 w-2 rounded-sm bg-brand-500" />
            Clicks
          </p>
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
