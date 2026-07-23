import { prisma } from "@/lib/prisma";
import { requireWorkspaceForPage } from "@/lib/workspace";
import { LinksClient } from "@/components/links/links-client";

export default async function LinksPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceForPage(workspaceSlug);

  const [links, tags, folders] = await Promise.all([
    prisma.link.findMany({
      where: { workspaceId: workspace.id, archived: false },
      include: { domain: true, tags: true, folder: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.tag.findMany({ where: { workspaceId: workspace.id } }),
    prisma.folder.findMany({ where: { workspaceId: workspace.id } }),
  ]);

  return (
    <LinksClient
      workspaceSlug={workspace.slug}
      initialLinks={JSON.parse(JSON.stringify(links))}
      tags={tags}
      folders={folders}
    />
  );
}
