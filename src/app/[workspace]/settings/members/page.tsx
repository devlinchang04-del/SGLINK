import { prisma } from "@/lib/prisma";
import { requireWorkspaceForPage } from "@/lib/workspace";
import { MembersClient } from "@/components/settings/members-client";

export default async function MembersPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: workspaceSlug } = await params;
  const { workspace, session } = await requireWorkspaceForPage(workspaceSlug);

  const [members, invites] = await Promise.all([
    prisma.workspaceUser.findMany({ where: { workspaceId: workspace.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.invite.findMany({ where: { workspaceId: workspace.id } }),
  ]);

  return (
    <MembersClient
      workspaceSlug={workspace.slug}
      currentUserId={session.user.id}
      initialMembers={members.map((m) => ({ userId: m.userId, name: m.user.name, email: m.user.email, role: m.role }))}
      initialInvites={invites.map((i) => ({ id: i.id, email: i.email, role: i.role, token: i.token }))}
    />
  );
}
