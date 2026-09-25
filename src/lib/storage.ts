import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

/**
 * File storage abstraction. STORAGE_DRIVER=local (default) stores files under ./storage.
 * For production use an S3-compatible bucket or Supabase Storage (see docs/DEPLOYMENT.md);
 * implement the same put/get interface.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  "image/png": { ext: "png", magic: [[0x89, 0x50, 0x4e, 0x47]] },
  "image/jpeg": { ext: "jpg", magic: [[0xff, 0xd8, 0xff]] },
  "application/pdf": { ext: "pdf", magic: [[0x25, 0x50, 0x44, 0x46]] },
  "text/plain": { ext: "txt", magic: [] },
};

const ROOT = path.resolve(process.cwd(), "storage");

export class UploadError extends Error {}

export function validateUpload(name: string, type: string, bytes: Uint8Array) {
  const spec = ALLOWED_TYPES[type];
  if (!spec) throw new UploadError("File type not allowed. Upload PNG, JPG, PDF or TXT files.");
  if (bytes.byteLength === 0) throw new UploadError("The file is empty.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("Files must be 5 MB or smaller.");
  if (spec.magic.length && !spec.magic.some((m) => m.every((b, i) => bytes[i] === b))) throw new UploadError("File content does not match its type.");
  if (type === "text/plain" && bytes.some((b) => b === 0)) throw new UploadError("Text files must not contain binary data.");
  const safeName = name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || `file.${spec.ext}`;
  return { safeName, ext: spec.ext };
}

export async function putObject(bytes: Uint8Array, ext: string): Promise<string> {
  const key = `${new Date().toISOString().slice(0, 7)}/${randomBytes(16).toString("hex")}.${ext}`;
  const full = path.join(ROOT, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, bytes);
  return key;
}

export async function getObject(key: string): Promise<Buffer> {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new UploadError("Invalid key");
  return fs.readFile(full);
}
