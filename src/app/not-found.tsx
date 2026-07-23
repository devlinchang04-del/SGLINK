import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-bold">This link doesn&apos;t exist</h1>
      <p className="text-neutral-500">It may have been deleted, or the URL is mistyped.</p>
      <Link href="/" className="text-brand-500 underline">
        Go home
      </Link>
    </main>
  );
}
