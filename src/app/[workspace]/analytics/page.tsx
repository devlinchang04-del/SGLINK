import { requireWorkspaceForPage } from "@/lib/workspace";
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

  return <AnalyticsClient workspaceSlug={workspace.slug} linkId={linkId} />;
}
