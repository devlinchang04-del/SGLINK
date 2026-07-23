import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";
import {
  getClickSeries,
  getTopCountries,
  getTopDevices,
  getTopLinks,
  getTopReferrers,
  getTotalClicks,
  type Range,
} from "@/lib/analytics";

const VALID_RANGES: Range[] = ["24h", "7d", "30d", "90d"];

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug);

    const rangeParam = request.nextUrl.searchParams.get("range") ?? "24h";
    const range: Range = VALID_RANGES.includes(rangeParam as Range) ? (rangeParam as Range) : "24h";
    const linkId = request.nextUrl.searchParams.get("linkId") ?? undefined;

    const [series, totalClicks, topReferrers, topCountries, topDevices, topLinks] = await Promise.all([
      getClickSeries(workspace.id, range, linkId),
      getTotalClicks(workspace.id, range, linkId),
      getTopReferrers(workspace.id, range, linkId),
      getTopCountries(workspace.id, range, linkId),
      getTopDevices(workspace.id, range, linkId),
      getTopLinks(workspace.id, range),
    ]);

    return NextResponse.json({ series, totalClicks, topReferrers, topCountries, topDevices, topLinks });
  } catch (err) {
    return errorResponse(err);
  }
}
