import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const ROLE_RANK: Record<Role, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

export class WorkspaceAccessError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

/** Resolves the current session user's membership in a workspace by slug, or throws. */
export async function requireWorkspaceMember(workspaceSlug: string, minRole: Role = "MEMBER") {
  const session = await auth();
  if (!session?.user?.id) throw new WorkspaceAccessError("Not signed in", 401);

  const workspace = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
  if (!workspace) throw new WorkspaceAccessError("Workspace not found", 404);

  const membership = await prisma.workspaceUser.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: workspace.id } },
  });
  if (!membership) throw new WorkspaceAccessError("Not a member of this workspace", 403);

  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new WorkspaceAccessError(`Requires ${minRole} role`, 403);
  }

  return { session, workspace, membership };
}

/** Same as requireWorkspaceMember, but for Server Components/pages: redirects instead of throwing. */
export async function requireWorkspaceForPage(workspaceSlug: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
  if (!workspace) redirect("/");

  const membership = await prisma.workspaceUser.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: workspace.id } },
  });
  if (!membership) redirect("/");

  const memberships = await prisma.workspaceUser.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    session,
    workspace,
    membership,
    workspaces: memberships.map((m) => ({ slug: m.workspace.slug, name: m.workspace.name })),
  };
}
