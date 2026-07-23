import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";

const patchSchema = z.object({ role: z.enum(["MEMBER", "ADMIN", "OWNER"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ workspace: string; userId: string }> }) {
  try {
    const { workspace: workspaceSlug, userId } = await params;
    const { workspace, membership: actingMembership } = await requireWorkspaceMember(workspaceSlug, "ADMIN");

    const target = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
    });
    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const body = patchSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

    if ((target.role === "OWNER" || body.data.role === "OWNER") && actingMembership.role !== "OWNER") {
      return NextResponse.json({ error: "Only an owner can change owner status" }, { status: 403 });
    }

    if (target.role === "OWNER" && body.data.role !== "OWNER") {
      const ownerCount = await prisma.workspaceUser.count({ where: { workspaceId: workspace.id, role: "OWNER" } });
      if (ownerCount <= 1) return NextResponse.json({ error: "Workspace must have at least one owner" }, { status: 400 });
    }

    const updated = await prisma.workspaceUser.update({ where: { id: target.id }, data: { role: body.data.role } });
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ workspace: string; userId: string }> }) {
  try {
    const { workspace: workspaceSlug, userId } = await params;
    const { workspace, membership: actingMembership, session } = await requireWorkspaceMember(workspaceSlug, "ADMIN");

    const target = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
    });
    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    if (target.role === "OWNER" && actingMembership.role !== "OWNER") {
      return NextResponse.json({ error: "Only an owner can remove an owner" }, { status: 403 });
    }

    if (target.role === "OWNER") {
      const ownerCount = await prisma.workspaceUser.count({ where: { workspaceId: workspace.id, role: "OWNER" } });
      if (ownerCount <= 1) return NextResponse.json({ error: "Workspace must have at least one owner" }, { status: 400 });
    }

    if (target.userId === session.user.id && target.role === "OWNER") {
      return NextResponse.json({ error: "Transfer ownership before leaving" }, { status: 400 });
    }

    await prisma.workspaceUser.delete({ where: { id: target.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
