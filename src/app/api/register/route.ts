import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  workspaceName: z.string().min(1).max(100),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }
  const { name, email, password, workspaceName } = body.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const baseSlug = slugify(workspaceName) || "workspace";
  let slug = baseSlug;
  for (let i = 0; await prisma.workspace.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i + 1}`;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashed,
      memberships: {
        create: {
          role: "OWNER",
          workspace: { create: { name: workspaceName, slug } },
        },
      },
    },
  });

  return NextResponse.json({ id: user.id, slug });
}
