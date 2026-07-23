import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { prisma } from "@/lib/prisma";
import { buildDestinationUrl, deviceCategoryFromUa } from "@/lib/links";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-sglink-key") ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!key) return NextResponse.redirect(appUrl);

  const link = await prisma.link.findFirst({ where: { domainId: null, key } });

  if (!link || link.archived) {
    return NextResponse.redirect(`${appUrl}/not-found`);
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.redirect(`${appUrl}/expired`);
  }

  if (link.password) {
    return NextResponse.redirect(`${appUrl}/verify/${link.id}`);
  }

  await trackClick(request, link.id);

  return NextResponse.redirect(buildDestinationUrl(link), { status: 307 });
}

async function trackClick(request: NextRequest, linkId: string) {
  const ua = new UAParser(request.headers.get("user-agent") ?? "").getResult();
  const referrerHost = safeHostname(request.headers.get("referer"));

  await prisma.$transaction([
    prisma.clickEvent.create({
      data: {
        linkId,
        country: request.headers.get("x-vercel-ip-country") ?? undefined,
        city: request.headers.get("x-vercel-ip-city") ?? undefined,
        region: request.headers.get("x-vercel-ip-country-region") ?? undefined,
        continent: request.headers.get("x-vercel-ip-continent") ?? undefined,
        device: deviceCategoryFromUa(ua),
        deviceVendor: ua.device.vendor ?? undefined,
        browser: ua.browser.name ?? undefined,
        os: ua.os.name ?? undefined,
        referrer: referrerHost ?? "(direct)",
      },
    }),
    prisma.link.update({ where: { id: linkId }, data: { clicks: { increment: 1 } } }),
  ]);
}

function safeHostname(referer: string | null) {
  if (!referer) return null;
  try {
    return new URL(referer).hostname;
  } catch {
    return null;
  }
}
