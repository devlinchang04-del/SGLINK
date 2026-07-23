import { prisma } from "@/lib/prisma";
import { requireWorkspaceForPage } from "@/lib/workspace";
import { KeysClient } from "@/components/settings/keys-client";

export default async function KeysPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceForPage(workspaceSlug);
  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return <KeysClient workspaceSlug={workspace.slug} initialKeys={JSON.parse(JSON.stringify(keys))} />;
}
