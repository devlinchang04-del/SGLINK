import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({ where: { token }, include: { workspace: true } });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite is invalid or has expired" }, { status: 404 });
  }
  return NextResponse.json({ workspaceName: invite.workspace.name, email: invite.email, role: invite.role });
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite is invalid or has expired" }, { status: 404 });
  }

  if (invite.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return NextResponse.json({ error: `This invite was sent to ${invite.email}` }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: invite.workspaceId } });
  if (!workspace) return NextResponse.json({ error: "Workspace no longer exists" }, { status: 404 });

  await prisma.$transaction([
    prisma.workspaceUser.upsert({
      where: { userId_workspaceId: { userId: session.user.id, workspaceId: invite.workspaceId } },
      update: { role: invite.role },
      create: { userId: session.user.id, workspaceId: invite.workspaceId, role: invite.role },
    }),
    prisma.invite.delete({ where: { id: invite.id } }),
  ]);

  return NextResponse.json({ slug: workspace.slug });
}
