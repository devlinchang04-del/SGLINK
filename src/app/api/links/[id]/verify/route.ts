import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buildDestinationUrl } from "@/lib/links";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { password } = await request.json();

  const link = await prisma.link.findUnique({ where: { id } });
  if (!link || !link.password) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(password ?? "", link.password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await prisma.link.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } });

  return NextResponse.json({ url: buildDestinationUrl(link) });
}
