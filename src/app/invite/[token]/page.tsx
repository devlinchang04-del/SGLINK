"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invite, setInvite] = useState<{ workspaceName: string; email: string; role: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((data) => (data.error ? setError(data.error) : setInvite(data)));
  }, [token]);

  async function accept() {
    setLoading(true);
    const res = await fetch(`/api/invites/${token}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }
    router.push(`/${data.slug}/links`);
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium">{error}</p>
        <Link href="/" className="text-brand-500 underline">Go home</Link>
      </main>
    );
  }

  if (!invite) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Join {invite.workspaceName}</h1>
      <p className="text-neutral-500">
        You&apos;ve been invited as <strong>{invite.role.toLowerCase()}</strong> ({invite.email})
      </p>

      {status === "unauthenticated" && (
        <p className="text-sm">
          <Link href={`/login?callbackUrl=/invite/${token}`} className="text-brand-500 underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href={`/register?callbackUrl=/invite/${token}`} className="text-brand-500 underline">
            create an account
          </Link>{" "}
          with {invite.email} to accept.
        </p>
      )}

      {status === "authenticated" && session?.user?.email?.toLowerCase() !== invite.email.toLowerCase() && (
        <p className="text-sm text-red-500">
          You&apos;re signed in as {session?.user?.email}. Sign out and use {invite.email} to accept this invite.
        </p>
      )}

      {status === "authenticated" && session?.user?.email?.toLowerCase() === invite.email.toLowerCase() && (
        <button
          onClick={accept}
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {loading ? "Joining..." : "Accept invite"}
        </button>
      )}
    </main>
  );
}
