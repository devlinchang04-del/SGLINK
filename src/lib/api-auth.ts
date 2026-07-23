import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/api-keys";

export class ApiAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireApiKeyWorkspace(request: NextRequest) {
  const auth = request.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!key) throw new ApiAuthError("Missing API key. Send 'Authorization: Bearer sg_live_...'");

  const record = await prisma.apiKey.findUnique({ where: { hashedKey: hashApiKey(key) }, include: { workspace: true } });
  if (!record) throw new ApiAuthError("Invalid API key");

  await prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });

  return record.workspace;
}
