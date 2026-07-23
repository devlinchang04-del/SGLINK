import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().min(1).max(100) });

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const memberships = await prisma.workspaceUser.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(memberships.map((m) => ({ ...m.workspace, role: m.role })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

  const baseSlug = slugify(body.data.name) || "workspace";
  let slug = baseSlug;
  for (let i = 0; await prisma.workspace.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i + 1}`;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: body.data.name,
      slug,
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });

  return NextResponse.json(workspace);
}
