export default function ExpiredPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-bold">This link has expired</h1>
      <p className="text-neutral-500">The owner set an expiration date that has passed.</p>
    </main>
  );
}
