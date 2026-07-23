"use client";

import { useState } from "react";
import { Copy, QrCode, Trash2, Plus, ExternalLink } from "lucide-react";
import { CreateLinkModal } from "@/components/links/create-link-modal";
import { shortUrlFor } from "@/lib/domains";
import { formatNumber, timeAgo } from "@/lib/utils";

type LinkRow = {
  id: string;
  key: string;
  url: string;
  title: string | null;
  clicks: number;
  createdAt: string;
  domain: { slug: string } | null;
  tags: { id: string; name: string; color: string }[];
};

export function LinksClient({
  workspaceSlug,
  initialLinks,
  tags,
  folders,
}: {
  workspaceSlug: string;
  initialLinks: LinkRow[];
  tags: { id: string; name: string; color: string }[];
  folders: { id: string; name: string }[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [showCreate, setShowCreate] = useState(false);
  const [qrFor, setQrFor] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(link: LinkRow) {
    await navigator.clipboard.writeText(shortUrlFor(link.domain?.slug ?? null, link.key));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function remove(link: LinkRow) {
    if (!confirm(`Delete ${shortUrlFor(link.domain?.slug ?? null, link.key)}?`)) return;
    const res = await fetch(`/api/w/${workspaceSlug}/links/${link.id}`, { method: "DELETE" });
    if (res.ok) setLinks((cur) => cur.filter((l) => l.id !== link.id));
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Links</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          <Plus size={16} /> Create link
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2 font-medium">Link</th>
              <th className="px-4 py-2 font-medium">Destination</th>
              <th className="px-4 py-2 font-medium">Clicks</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {links.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  No links yet. Create your first one.
                </td>
              </tr>
            )}
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{link.title || shortUrlFor(link.domain?.slug ?? null, link.key)}</div>
                  {link.title && (
                    <div className="text-xs text-neutral-400">{shortUrlFor(link.domain?.slug ?? null, link.key)}</div>
                  )}
                  {link.tags.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {link.tags.map((t) => (
                        <span key={t.id} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium dark:bg-neutral-800">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-neutral-500">{link.url}</td>
                <td className="px-4 py-3">{formatNumber(link.clicks)}</td>
                <td className="px-4 py-3 text-neutral-400">{timeAgo(link.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => copy(link)} title="Copy" className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                      {copiedId === link.id ? <span className="text-xs text-green-600">Copied</span> : <Copy size={15} />}
                    </button>
                    <button onClick={() => setQrFor(link.id)} title="QR code" className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                      <QrCode size={15} />
                    </button>
                    <a href={`/${workspaceSlug}/analytics?linkId=${link.id}`} title="Analytics" className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                      <ExternalLink size={15} />
                    </a>
                    <button onClick={() => remove(link)} title="Delete" className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateLinkModal
          workspaceSlug={workspaceSlug}
          tags={tags}
          folders={folders}
          onClose={() => setShowCreate(false)}
          onCreated={(link) => {
            setLinks((cur) => [link as LinkRow, ...cur]);
            setShowCreate(false);
          }}
        />
      )}

      {qrFor && (
        <QrModal
          src={`/api/w/${workspaceSlug}/links/${qrFor}/qr`}
          onClose={() => setQrFor(null)}
        />
      )}
    </div>
  );
}

function QrModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="rounded-xl bg-white p-6 dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="QR code" width={280} height={280} />
        <a href={src} download="qrcode.png" className="mt-3 block text-center text-sm font-medium text-brand-500">
          Download PNG
        </a>
      </div>
    </div>
  );
}
