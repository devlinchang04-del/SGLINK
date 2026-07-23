import { prisma } from "@/lib/prisma";
import { requireWorkspaceForPage } from "@/lib/workspace";
import { shortUrlFor } from "@/lib/domains";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ linkId?: string }>;
}) {
  const { workspace: workspaceSlug } = await params;
  const { linkId } = await searchParams;
  const { workspace } = await requireWorkspaceForPage(workspaceSlug);

  let linkLabel: string | null = null;
  if (linkId) {
    const link = await prisma.link.findFirst({ where: { id: linkId, workspaceId: workspace.id }, include: { domain: true } });
    if (link) linkLabel = link.title || shortUrlFor(link.domain?.slug ?? null, link.key);
  }

  return <AnalyticsClient workspaceSlug={workspace.slug} linkId={linkId} linkLabel={linkLabel} />;
}
