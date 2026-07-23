"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkspaceOption = { slug: string; name: string };

export function WorkspaceSwitcher({ current, workspaces }: { current: WorkspaceOption; workspaces: WorkspaceOption[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-sm font-semibold text-white">
          {current.name.charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 truncate font-medium">{current.name}</span>
        <ChevronsUpDown size={14} className="text-neutral-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            {workspaces.map((w) => (
              <button
                key={w.slug}
                onClick={() => {
                  setOpen(false);
                  router.push(`/${w.slug}/links`);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  w.slug === current.slug && "bg-neutral-100 dark:bg-neutral-800"
                )}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-brand-500 text-[10px] font-semibold text-white">
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{w.name}</span>
              </button>
            ))}
            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            <button
              onClick={() => {
                setOpen(false);
                router.push("/onboarding");
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Plus size={14} /> New workspace
            </button>
          </div>
        </>
      )}
    </div>
  );
}
