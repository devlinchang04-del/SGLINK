import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";

const updateSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  password: z.string().max(100).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  folderId: z.string().optional().nullable(),
  archived: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
  utmSource: z.string().max(200).optional().nullable(),
  utmMedium: z.string().max(200).optional().nullable(),
  utmCampaign: z.string().max(200).optional().nullable(),
  utmTerm: z.string().max(200).optional().nullable(),
  utmContent: z.string().max(200).optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ workspace: string; id: string }> }) {
  try {
    const { workspace: workspaceSlug, id } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug);

    const link = await prisma.link.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    const body = updateSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
    const { tagIds, password, expiresAt, ...rest } = body.data;

    const updated = await prisma.link.update({
      where: { id: link.id },
      data: {
        ...rest,
        ...(password !== undefined ? { password: password ? await bcrypt.hash(password, 10) : null } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
        ...(tagIds ? { tags: { set: tagIds.map((id) => ({ id })) } } : {}),
      },
      include: { domain: true, tags: true, folder: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ workspace: string; id: string }> }) {
  try {
    const { workspace: workspaceSlug, id } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug);

    const link = await prisma.link.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    await prisma.link.delete({ where: { id: link.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
