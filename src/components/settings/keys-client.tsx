"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type ApiKey = { id: string; name: string; keyPrefix: string; lastUsedAt: string | null; createdAt: string };

export function KeysClient({ workspaceSlug, initialKeys }: { workspaceSlug: string; initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/w/${workspaceSlug}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setKeys((cur) => [{ id: data.id, name: data.name, keyPrefix: data.keyPrefix, lastUsedAt: null, createdAt: new Date().toISOString() }, ...cur]);
    setNewKey(data.key);
    setName("");
  }

  async function remove(id: string) {
    if (!confirm("Revoke this key? Any integrations using it will stop working.")) return;
    const res = await fetch(`/api/w/${workspaceSlug}/keys/${id}`, { method: "DELETE" });
    if (res.ok) setKeys((cur) => cur.filter((k) => k.id !== id));
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold">API Keys</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Use these keys to create and list links programmatically: <code>Authorization: Bearer sg_live_...</code> against{" "}
        <code>/api/v1/links</code>.
      </p>

      <form onSubmit={create} className="mb-2 flex gap-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Zapier)"
          className="max-w-xs flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button type="submit" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900">
          Create key
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {newKey && (
        <p className="mb-4 rounded-lg bg-yellow-50 px-3 py-2 text-sm dark:bg-yellow-950">
          Copy this now — it won&apos;t be shown again: <code className="break-all font-medium">{newKey}</code>
        </p>
      )}

      <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{k.name}</p>
              <p className="text-neutral-400">
                {k.keyPrefix}... · {k.lastUsedAt ? `last used ${timeAgo(k.lastUsedAt)}` : "never used"}
              </p>
            </div>
            <button onClick={() => remove(k.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {keys.length === 0 && <p className="px-4 py-6 text-neutral-400">No API keys yet.</p>}
      </div>
    </div>
  );
}
