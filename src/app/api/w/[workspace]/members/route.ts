import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";

const inviteSchema = z.object({ email: z.string().email(), role: z.enum(["MEMBER", "ADMIN"]) });

export async function GET(_request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug);

    const [members, invites] = await Promise.all([
      prisma.workspaceUser.findMany({ where: { workspaceId: workspace.id }, include: { user: true }, orderBy: { createdAt: "asc" } }),
      prisma.invite.findMany({ where: { workspaceId: workspace.id } }),
    ]);

    return NextResponse.json({
      members: members.map((m) => ({ userId: m.userId, name: m.user.name, email: m.user.email, role: m.role })),
      invites: invites.map((i) => ({ id: i.id, email: i.email, role: i.role, token: i.token })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug, "ADMIN");

    const body = inviteSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

    const alreadyMember = await prisma.workspaceUser.findFirst({
      where: { workspaceId: workspace.id, user: { email: body.data.email.toLowerCase() } },
    });
    if (alreadyMember) return NextResponse.json({ error: "Already a member of this workspace" }, { status: 409 });

    const invite = await prisma.invite.upsert({
      where: { workspaceId_email: { workspaceId: workspace.id, email: body.data.email.toLowerCase() } },
      update: { role: body.data.role, token: randomBytes(16).toString("hex"), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      create: {
        workspaceId: workspace.id,
        email: body.data.email.toLowerCase(),
        role: body.data.role,
        token: randomBytes(16).toString("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
