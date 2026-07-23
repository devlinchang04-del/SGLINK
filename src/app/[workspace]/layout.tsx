import { requireWorkspaceForPage } from "@/lib/workspace";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceSlug } = await params;
  const { workspace, workspaces, session } = await requireWorkspaceForPage(workspaceSlug);

  return (
    <div className="flex">
      <Sidebar
        workspaceSlug={workspace.slug}
        workspaceName={workspace.name}
        workspaces={workspaces}
        userName={session.user.name ?? session.user.email ?? ""}
      />
      <main className="h-screen flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">{children}</main>
    </div>
  );
}
