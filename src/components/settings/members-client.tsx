"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

type Member = { userId: string; name: string | null; email: string; role: "OWNER" | "ADMIN" | "MEMBER" };
type Invite = { id: string; email: string; role: string; token: string };

export function MembersClient({
  workspaceSlug,
  currentUserId,
  initialMembers,
  initialInvites,
}: {
  workspaceSlug: string;
  currentUserId: string;
  initialMembers: Member[];
  initialInvites: Invite[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/w/${workspaceSlug}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setInvites((cur) => [...cur.filter((i) => i.email !== data.email), { id: data.id, email: data.email, role: data.role, token: data.token }]);
    setInviteLink(`${window.location.origin}/invite/${data.token}`);
    setEmail("");
  }

  async function changeRole(userId: string, newRole: Member["role"]) {
    const res = await fetch(`/api/w/${workspaceSlug}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setMembers((cur) => cur.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)));
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member?")) return;
    const res = await fetch(`/api/w/${workspaceSlug}/members/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setMembers((cur) => cur.filter((m) => m.userId !== userId));
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Members</h1>

      <form onSubmit={invite} className="mb-2 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@example.com"
          className="max-w-xs flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <select value={role} onChange={(e) => setRole(e.target.value as "MEMBER" | "ADMIN")} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button type="submit" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900">
          Invite
        </button>
      </form>
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      {inviteLink && (
        <p className="mb-4 rounded-lg bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-800">
          Share this link: <code className="break-all">{inviteLink}</code>
        </p>
      )}

      <div className="mb-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{m.name || m.email}</p>
              <p className="text-sm text-neutral-400">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={m.role}
                onChange={(e) => changeRole(m.userId, e.target.value as Member["role"])}
                disabled={m.userId === currentUserId}
                className="rounded-lg border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>
              {m.userId !== currentUserId && (
                <button onClick={() => removeMember(m.userId)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {invites.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">Pending invites</h2>
          <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{i.email}</span>
                <span className="text-neutral-400">{i.role.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
