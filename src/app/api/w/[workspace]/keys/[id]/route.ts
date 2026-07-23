import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ workspace: string; id: string }> }) {
  try {
    const { workspace: workspaceSlug, id } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug, "ADMIN");
    const key = await prisma.apiKey.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

    await prisma.apiKey.delete({ where: { id: key.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
