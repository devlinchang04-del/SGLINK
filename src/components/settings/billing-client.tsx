"use client";

import { useState } from "react";

export function BillingClient({
  workspaceSlug,
  plan,
  linksUsed,
  linksLimit,
  clicksUsed,
  clicksLimit,
}: {
  workspaceSlug: string;
  plan: "FREE" | "PRO";
  linksUsed: number;
  linksLimit: number;
  clicksUsed: number;
  clicksLimit: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function go(endpoint: "checkout" | "portal") {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/w/${workspaceSlug}/billing/${endpoint}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="max-w-lg p-6">
      <h1 className="mb-4 text-xl font-semibold">Billing</h1>

      <div className="mb-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm text-neutral-500">Current plan</p>
        <p className="text-2xl font-semibold">{plan === "PRO" ? "Pro" : "Free"}</p>
      </div>

      <div className="mb-4 space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <Usage label="Links" used={linksUsed} limit={linksLimit} />
        <Usage label="Clicks this period" used={clicksUsed} limit={clicksLimit} />
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {plan === "FREE" ? (
        <button
          onClick={() => go("checkout")}
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {loading ? "Redirecting..." : "Upgrade to Pro — $29/mo"}
        </button>
      ) : (
        <button
          onClick={() => go("portal")}
          disabled={loading}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
        >
          {loading ? "Redirecting..." : "Manage billing"}
        </button>
      )}
    </div>
  );
}

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-neutral-500">{label}</span>
        <span className="tabular-nums">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
