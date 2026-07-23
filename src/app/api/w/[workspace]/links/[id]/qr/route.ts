import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";
import { shortUrlFor } from "@/lib/domains";

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspace: string; id: string }> }) {
  try {
    const { workspace: workspaceSlug, id } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug);

    const link = await prisma.link.findFirst({ where: { id, workspaceId: workspace.id }, include: { domain: true } });
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    const size = Number(request.nextUrl.searchParams.get("size") ?? 300);
    const url = shortUrlFor(link.domain?.slug ?? null, link.key);
    const png = await QRCode.toBuffer(url, { width: size, margin: 1 });

    return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" } });
  } catch (err) {
    return errorResponse(err);
  }
}
