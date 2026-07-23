import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiKeyWorkspace, ApiAuthError } from "@/lib/api-auth";
import { generateKey } from "@/lib/slug";
import { shortUrlFor } from "@/lib/domains";

const createSchema = z.object({
  url: z.string().url(),
  key: z.string().min(1).max(60).regex(/^[a-zA-Z0-9-_]+$/).optional(),
  title: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const workspace = await requireApiKeyWorkspace(request);
    const links = await prisma.link.findMany({
      where: { workspaceId: workspace.id, archived: false },
      include: { domain: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      links.map((l) => ({
        id: l.id,
        shortLink: shortUrlFor(l.domain?.slug ?? null, l.key),
        url: l.url,
        title: l.title,
        clicks: l.clicks,
        createdAt: l.createdAt,
      }))
    );
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireApiKeyWorkspace(request);

    const body = createSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

    const linkCount = await prisma.link.count({ where: { workspaceId: workspace.id } });
    if (linkCount >= workspace.linksLimit) {
      return NextResponse.json({ error: `Plan limit reached (${workspace.linksLimit} links)` }, { status: 402 });
    }

    const key = body.data.key ?? generateKey();
    const existing = await prisma.link.findFirst({ where: { domainId: null, key } });
    if (existing) return NextResponse.json({ error: "That short link already exists" }, { status: 409 });

    const link = await prisma.link.create({
      data: { workspaceId: workspace.id, key, url: body.data.url, title: body.data.title },
    });

    return NextResponse.json(
      { id: link.id, shortLink: shortUrlFor(null, link.key), url: link.url, title: link.title, clicks: 0, createdAt: link.createdAt },
      { status: 201 }
    );
  } catch (err) {
    return apiErrorResponse(err);
  }
}

function apiErrorResponse(err: unknown) {
  if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error(err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
