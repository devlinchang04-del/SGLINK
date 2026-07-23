import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    const membership = await prisma.workspaceUser.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    redirect(membership ? `/${membership.workspace.slug}/links` : "/onboarding");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Short links. <span className="text-brand-500">Real analytics.</span>
      </h1>
      <p className="max-w-xl text-neutral-500 dark:text-neutral-400">
        Shorten, share, and track every click — with geo, device, and referrer analytics,
        custom domains, QR codes, and team workspaces.
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          Get started free
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
