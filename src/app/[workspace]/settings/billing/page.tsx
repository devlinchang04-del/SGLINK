import { prisma } from "@/lib/prisma";
import { requireWorkspaceForPage } from "@/lib/workspace";
import { BillingClient } from "@/components/settings/billing-client";

export default async function BillingPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: workspaceSlug } = await params;
  const { workspace } = await requireWorkspaceForPage(workspaceSlug);

  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const [linksUsed, clicksUsed] = await Promise.all([
    prisma.link.count({ where: { workspaceId: workspace.id } }),
    prisma.clickEvent.count({ where: { link: { workspaceId: workspace.id }, createdAt: { gte: periodStart } } }),
  ]);

  return (
    <BillingClient
      workspaceSlug={workspace.slug}
      plan={workspace.plan}
      linksUsed={linksUsed}
      linksLimit={workspace.linksLimit}
      clicksUsed={clicksUsed}
      clicksLimit={workspace.clicksLimit}
    />
  );
}
