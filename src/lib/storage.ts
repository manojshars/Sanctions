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

export async function deleteObject(key: string): Promise<void> {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new UploadError("Invalid key");
  await fs.rm(full, { force: true });
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
