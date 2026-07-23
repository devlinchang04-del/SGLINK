import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type Range = "24h" | "7d" | "30d" | "90d";

export function rangeToSince(range: Range): Date {
  const now = Date.now();
  const ms: Record<Range, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  };
  return new Date(now - ms[range]);
}

function bucketUnit(range: Range) {
  return range === "24h" ? "hour" : "day";
}

async function linkFilter(workspaceId: string, linkId?: string) {
  const links = await prisma.link.findMany({ where: { workspaceId, ...(linkId ? { id: linkId } : {}) }, select: { id: true } });
  return links.map((l) => l.id);
}

export async function getClickSeries(workspaceId: string, range: Range, linkId?: string) {
  const linkIds = await linkFilter(workspaceId, linkId);
  if (linkIds.length === 0) return [];

  const since = rangeToSince(range);
  const unit = bucketUnit(range);

  const rows = await prisma.$queryRaw<{ bucket: Date; clicks: bigint }[]>`
    SELECT date_trunc(${unit}, "createdAt") AS bucket, COUNT(*)::bigint AS clicks
    FROM "ClickEvent"
    WHERE "linkId" IN (${Prisma.join(linkIds)}) AND "createdAt" >= ${since}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  return rows.map((r) => ({ t: r.bucket.toISOString(), clicks: Number(r.clicks) }));
}

export async function getTotalClicks(workspaceId: string, range: Range, linkId?: string) {
  const linkIds = await linkFilter(workspaceId, linkId);
  if (linkIds.length === 0) return 0;

  const since = rangeToSince(range);
  const count = await prisma.clickEvent.count({ where: { linkId: { in: linkIds }, createdAt: { gte: since } } });
  return count;
}

async function topBy(
  column: "referrer" | "country" | "device" | "browser" | "os",
  workspaceId: string,
  range: Range,
  linkId?: string,
  limit = 8
) {
  const linkIds = await linkFilter(workspaceId, linkId);
  if (linkIds.length === 0) return [];

  const since = rangeToSince(range);
  const grouped = await prisma.clickEvent.groupBy({
    by: [column],
    where: { linkId: { in: linkIds }, createdAt: { gte: since } },
    _count: { _all: true },
  });

  return grouped
    .map((g) => ({ label: (g[column] as string | null) ?? "Unknown", clicks: g._count._all }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

export const getTopReferrers = (workspaceId: string, range: Range, linkId?: string) => topBy("referrer", workspaceId, range, linkId);
export const getTopCountries = (workspaceId: string, range: Range, linkId?: string) => topBy("country", workspaceId, range, linkId);
export const getTopDevices = (workspaceId: string, range: Range, linkId?: string) => topBy("device", workspaceId, range, linkId);

export async function getTopLinks(workspaceId: string, range: Range, limit = 8) {
  const since = rangeToSince(range);
  const rows = await prisma.$queryRaw<{ id: string; key: string; domain: string | null; title: string | null; clicks: bigint }[]>`
    SELECT l.id, l.key, d.slug AS domain, l.title, COUNT(c.id)::bigint AS clicks
    FROM "Link" l
    LEFT JOIN "Domain" d ON d.id = l."domainId"
    LEFT JOIN "ClickEvent" c ON c."linkId" = l.id AND c."createdAt" >= ${since}
    WHERE l."workspaceId" = ${workspaceId}
    GROUP BY l.id, d.slug
    ORDER BY clicks DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...r, clicks: Number(r.clicks) }));
}
