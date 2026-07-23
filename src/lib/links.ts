import type { Link } from "@prisma/client";

/** Appends the link's configured UTM parameters onto its destination URL. */
export function buildDestinationUrl(link: Pick<Link, "url" | "utmSource" | "utmMedium" | "utmCampaign" | "utmTerm" | "utmContent">) {
  let dest: URL;
  try {
    dest = new URL(link.url);
  } catch {
    return link.url;
  }

  const utm: Record<string, string | null> = {
    utm_source: link.utmSource,
    utm_medium: link.utmMedium,
    utm_campaign: link.utmCampaign,
    utm_term: link.utmTerm,
    utm_content: link.utmContent,
  };

  for (const [key, value] of Object.entries(utm)) {
    if (value) dest.searchParams.set(key, value);
  }

  return dest.toString();
}

export function deviceCategoryFromUa(ua: import("ua-parser-js").IResult) {
  const type = ua.device.type;
  if (type === "mobile") return "Mobile";
  if (type === "tablet") return "Tablet";
  return "Desktop";
}
