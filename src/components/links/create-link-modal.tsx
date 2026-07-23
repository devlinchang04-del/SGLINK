"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type Tag = { id: string; name: string; color: string };
type Folder = { id: string; name: string };

export function CreateLinkModal({
  workspaceSlug,
  tags,
  folders,
  onClose,
  onCreated,
}: {
  workspaceSlug: string;
  tags: Tag[];
  folders: Folder[];
  onClose: () => void;
  onCreated: (link: unknown) => void;
}) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showUtm, setShowUtm] = useState(false);
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "", term: "", content: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const domainLabel = process.env.NEXT_PUBLIC_DEFAULT_DOMAIN ?? "sglink.to";

  const preview = useMemo(() => `${domainLabel}/${key || "..."}`, [domainLabel, key]);

  function toggleTag(id: string) {
    setTagIds((cur) => (cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/w/${workspaceSlug}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        key: key || undefined,
        title: title || undefined,
        folderId: folderId || undefined,
        tagIds,
        password: password || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        utmSource: utm.source || undefined,
        utmMedium: utm.medium || undefined,
        utmCampaign: utm.campaign || undefined,
        utmTerm: utm.term || undefined,
        utmContent: utm.content || undefined,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    onCreated(data);
  }

  const inputClass = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <Modal title="Create link" onClose={onClose} wide>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Destination URL</label>
          <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/very-long-path" className={inputClass} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Back-half (optional)</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="custom-slug" className={inputClass} />
        </div>

        <p className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-500 dark:bg-neutral-800">{preview}</p>

        <div>
          <label className="mb-1 block text-sm font-medium">Title (optional)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Folder</label>
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className={inputClass}>
              <option value="">None</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Expires at</label>
            <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputClass} />
          </div>
        </div>

        {tags.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium",
                    tagIds.includes(t.id) ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10" : "border-neutral-300 dark:border-neutral-700"
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Password protect (optional)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank for no password" className={inputClass} />
        </div>

        <div>
          <button type="button" onClick={() => setShowUtm((s) => !s)} className="text-sm font-medium text-brand-500">
            {showUtm ? "Hide" : "Add"} UTM parameters
          </button>
          {showUtm && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input placeholder="utm_source" value={utm.source} onChange={(e) => setUtm((u) => ({ ...u, source: e.target.value }))} className={inputClass} />
              <input placeholder="utm_medium" value={utm.medium} onChange={(e) => setUtm((u) => ({ ...u, medium: e.target.value }))} className={inputClass} />
              <input placeholder="utm_campaign" value={utm.campaign} onChange={(e) => setUtm((u) => ({ ...u, campaign: e.target.value }))} className={inputClass} />
              <input placeholder="utm_term" value={utm.term} onChange={(e) => setUtm((u) => ({ ...u, term: e.target.value }))} className={inputClass} />
              <input placeholder="utm_content" value={utm.content} onChange={(e) => setUtm((u) => ({ ...u, content: e.target.value }))} className={inputClass} />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <button type="button" onClick={onClose} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900">
            {loading ? "Creating..." : "Create link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
