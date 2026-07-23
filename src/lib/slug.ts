import { customAlphabet } from "nanoid";

// unambiguous alphabet (no 0/O/1/l/I) for short link keys
const nanoid = customAlphabet("23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ", 7);

export function generateKey() {
  return nanoid();
}
