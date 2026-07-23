export function shortUrlFor(domainSlug: string | null, key: string) {
  const host = domainSlug ?? process.env.NEXT_PUBLIC_DEFAULT_DOMAIN ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}/${key}`;
}
