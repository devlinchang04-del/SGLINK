import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";

const schema = z.object({ name: z.string().min(1).max(50) });

export async function GET(_request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug);
    const folders = await prisma.folder.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } });
    return NextResponse.json(folders);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug);
    const body = schema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

    const folder = await prisma.folder.create({ data: { workspaceId: workspace.id, name: body.data.name } });
    return NextResponse.json(folder, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
