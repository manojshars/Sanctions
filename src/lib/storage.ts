import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

/**
 * File storage abstraction.
 * - Vercel Blob (private store) when BLOB_READ_WRITE_TOKEN is set — required on Vercel, whose
 *   filesystem is not persistent. Keys are stored as `blob:<pathname>`.
 * - Otherwise local disk under ./storage (development, single-server hosting).
 */
/** Support attachments: per file and per message (Vercel caps request bodies at 4.5 MB). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const BLOB_PREFIX = "blob:";

export function blobStorageEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN && process.env.STORAGE_DRIVER !== "local";
}
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
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("Attachments must be 4 MB or smaller in total.");
  if (spec.magic.length && !spec.magic.some((m) => m.every((b, i) => bytes[i] === b))) throw new UploadError("File content does not match its type.");
  if (type === "text/plain" && bytes.some((b) => b === 0)) throw new UploadError("Text files must not contain binary data.");
  const safeName = name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || `file.${spec.ext}`;
  return { safeName, ext: spec.ext };
}

const MIME_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", pdf: "application/pdf", txt: "text/plain" };

export async function putObject(bytes: Uint8Array, ext: string, folder = "uploads"): Promise<string> {
  const name = `${folder}/${new Date().toISOString().slice(0, 7)}/${randomBytes(16).toString("hex")}.${ext}`;
  if (blobStorageEnabled()) {
    const { put } = await import("@vercel/blob");
    const r = await put(name, Buffer.from(bytes), { access: "private", contentType: MIME_BY_EXT[ext] ?? "application/octet-stream", addRandomSuffix: false });
    return BLOB_PREFIX + r.pathname;
  }
  const full = path.join(ROOT, name);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, bytes);
  return name;
}

export async function getObject(key: string): Promise<Buffer> {
  if (key.startsWith(BLOB_PREFIX)) {
    const { get } = await import("@vercel/blob");
    const r = await get(key.slice(BLOB_PREFIX.length), { access: "private", useCache: false });
    if (!r || r.statusCode !== 200 || !r.stream) throw new UploadError("Stored file not found");
    return Buffer.from(await new Response(r.stream).arrayBuffer());
  }
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new UploadError("Invalid key");
  return fs.readFile(full);
}

export async function deleteObject(key: string): Promise<void> {
  if (key.startsWith(BLOB_PREFIX)) {
    const { del } = await import("@vercel/blob");
    await del(key.slice(BLOB_PREFIX.length));
    return;
  }
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new UploadError("Invalid key");
  await fs.rm(full, { force: true });
}

/** Folder that browsers upload training-material PDFs into directly (Vercel Blob client uploads). */
export const DIRECT_MATERIAL_FOLDER = "materials/";

/** Storage key for a PDF the browser uploaded straight to Blob storage; null if the pathname is not acceptable. */
export function directUploadKey(pathname: string): string | null {
  if (!blobStorageEnabled()) return null;
  if (!pathname.startsWith(DIRECT_MATERIAL_FOLDER) || pathname.includes("..") || !/^[\w./ -]+\.pdf$/i.test(pathname)) return null;
  return BLOB_PREFIX + pathname;
}

// ───── Training material PDFs ─────

export const MAX_MATERIAL_BYTES = 25 * 1024 * 1024;

/** PDF name-tree entries that make a document run code or carry hidden files. */
const ACTIVE_PDF_MARKERS = ["/JavaScript", "/JS", "/Launch", "/EmbeddedFile", "/RichMedia"];

/**
 * Validates an uploaded training-material PDF: extension/type, size, `%PDF-` signature, that it
 * parses as a PDF, and that it contains no scripts, launch actions or embedded files.
 * Returns a safe download filename and the page count.
 */
export async function validatePdf(name: string, type: string, bytes: Uint8Array): Promise<{ safeName: string; pageCount: number }> {
  if (bytes.byteLength === 0) throw new UploadError("The file is empty.");
  if (bytes.byteLength > MAX_MATERIAL_BYTES) throw new UploadError("PDF files must be 25 MB or smaller.");
  if (!/\.pdf$/i.test(name) || (type && type !== "application/pdf" && type !== "application/octet-stream")) throw new UploadError("Only PDF files can be uploaded.");
  const head = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
  if (!head.includes("%PDF-")) throw new UploadError("The file is not a valid PDF.");
  const text = Buffer.from(bytes).toString("latin1");
  const marker = ACTIVE_PDF_MARKERS.find((m) => new RegExp(`${m.replace("/", "\\/")}(?![A-Za-z])`).test(text));
  if (marker) throw new UploadError(`PDFs containing scripts, launch actions or embedded files are not accepted (found ${marker}). Re-export the document as a plain PDF.`);
  let pageCount: number;
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    pageCount = doc.getPageCount();
  } catch {
    throw new UploadError("The PDF could not be read. It may be damaged; re-export it and try again.");
  }
  if (pageCount < 1) throw new UploadError("The PDF has no pages.");
  const base = name.replace(/\.pdf$/i, "").replace(/[^\w.\- ]+/g, "_").trim().slice(0, 110) || "material";
  return { safeName: `${base}.pdf`, pageCount };
}
