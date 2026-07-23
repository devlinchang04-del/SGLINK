import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";
import { generateApiKey } from "@/lib/api-keys";

const schema = z.object({ name: z.string().min(1).max(100) });

export async function GET(_request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug, "ADMIN");
    const keys = await prisma.apiKey.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(keys);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug, "ADMIN");
    const body = schema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

    const { key, keyPrefix, hashedKey } = generateApiKey();
    const created = await prisma.apiKey.create({
      data: { workspaceId: workspace.id, name: body.data.name, keyPrefix, hashedKey },
    });

    return NextResponse.json({ id: created.id, name: created.name, keyPrefix, key }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
