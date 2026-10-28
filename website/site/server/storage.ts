// File storage on the server's own disk (replaces the Manus Forge/S3 storage used on the old host).
// Files live in UPLOAD_DIR (default ./uploads) and are served at /manus-storage/{key},
// the same URL shape the old host used, so image URLs already saved in the database keep working.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

function normalizeKey(relKey: string): string {
  return relKey.replace(/\\/g, "/").replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

// Absolute path for a key, or null if the key tries to leave UPLOAD_DIR.
export function storagePath(relKey: string): string | null {
  const file = path.resolve(UPLOAD_DIR, normalizeKey(relKey));
  return file.startsWith(UPLOAD_DIR + path.sep) ? file : null;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const file = storagePath(key);
  if (!file) throw new Error("Invalid storage key");
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, data);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  return (await storageGet(relKey)).url;
}
