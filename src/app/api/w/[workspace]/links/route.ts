import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";
import { generateKey } from "@/lib/slug";

const createSchema = z.object({
  url: z.string().url(),
  key: z.string().min(1).max(60).regex(/^[a-zA-Z0-9-_]+$/).optional(),
  domainId: z.string().optional().nullable(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  password: z.string().min(1).max(100).optional(),
  expiresAt: z.string().datetime().optional(),
  folderId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug);
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const folderId = request.nextUrl.searchParams.get("folderId") ?? undefined;
    const tagId = request.nextUrl.searchParams.get("tagId") ?? undefined;

    const links = await prisma.link.findMany({
      where: {
        workspaceId: workspace.id,
        archived: false,
        folderId: folderId || undefined,
        tags: tagId ? { some: { id: tagId } } : undefined,
        ...(search
          ? { OR: [{ url: { contains: search, mode: "insensitive" } }, { key: { contains: search, mode: "insensitive" } }, { title: { contains: search, mode: "insensitive" } }] }
          : {}),
      },
      include: { domain: true, tags: true, folder: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(links);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace, session } = await requireWorkspaceMember(workspaceSlug);

    const body = createSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
    const data = body.data;

    const linkCount = await prisma.link.count({ where: { workspaceId: workspace.id } });
    if (linkCount >= workspace.linksLimit) {
      return NextResponse.json({ error: `Plan limit reached (${workspace.linksLimit} links). Upgrade to Pro for more.` }, { status: 402 });
    }

    if (data.domainId) {
      const domain = await prisma.domain.findFirst({ where: { id: data.domainId, workspaceId: workspace.id } });
      if (!domain) return NextResponse.json({ error: "Domain not found" }, { status: 400 });
    }

    const key = data.key ?? generateKey();
    const existing = await prisma.link.findFirst({ where: { domainId: data.domainId ?? null, key } });
    if (existing) return NextResponse.json({ error: "That short link already exists" }, { status: 409 });

    const link = await prisma.link.create({
      data: {
        workspaceId: workspace.id,
        domainId: data.domainId ?? null,
        key,
        url: data.url,
        title: data.title,
        description: data.description,
        password: data.password ? await bcrypt.hash(data.password, 10) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        folderId: data.folderId ?? null,
        createdBy: session.user.id,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
        tags: data.tagIds ? { connect: data.tagIds.map((id) => ({ id })) } : undefined,
      },
      include: { domain: true, tags: true, folder: true },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
