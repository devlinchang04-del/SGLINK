export function StatCard({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className={`flex-1 border-b-2 px-4 py-3 ${active ? "border-neutral-900 dark:border-white" : "border-transparent"}`}>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
