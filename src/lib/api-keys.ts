import { randomBytes, createHash } from "crypto";

const PREFIX = "sg_live_";

export function generateApiKey() {
  const secret = randomBytes(24).toString("base64url");
  const key = `${PREFIX}${secret}`;
  return { key, keyPrefix: key.slice(0, PREFIX.length + 6), hashedKey: hashApiKey(key) };
}

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}
