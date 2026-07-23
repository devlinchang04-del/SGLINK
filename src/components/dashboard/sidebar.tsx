"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Link2, BarChart3, Users, CreditCard, KeyRound, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";

type WorkspaceOption = { slug: string; name: string };

const NAV = [
  {
    section: null,
    items: [{ href: "links", label: "Links", icon: Link2 }],
  },
  {
    section: "Insights",
    items: [{ href: "analytics", label: "Analytics", icon: BarChart3 }],
  },
  {
    section: "Settings",
    items: [
      { href: "settings/members", label: "Members", icon: Users },
      { href: "settings/billing", label: "Billing", icon: CreditCard },
      { href: "settings/keys", label: "API Keys", icon: KeyRound },
    ],
  },
];

export function Sidebar({
  workspaceSlug,
  workspaceName,
  workspaces,
  userName,
}: {
  workspaceSlug: string;
  workspaceName: string;
  workspaces: WorkspaceOption[];
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-neutral-200 p-3 dark:border-neutral-800">
      <WorkspaceSwitcher current={{ slug: workspaceSlug, name: workspaceName }} workspaces={workspaces} />

      <nav className="mt-4 flex-1 space-y-4 overflow-y-auto">
        {NAV.map((group, i) => (
          <div key={i}>
            {group.section && (
              <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-neutral-400">{group.section}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const href = `/${workspaceSlug}/${item.href}`;
                const active = pathname === href || pathname.startsWith(`${href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium",
                      active
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-500"
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        <LogOut size={16} />
        Sign out ({userName})
      </button>
    </aside>
  );
}
