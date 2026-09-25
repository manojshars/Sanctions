import { createHash } from "crypto";
import { normalizeText } from "./scoring";

/** Content fingerprint for duplicate detection: normalised stem + sorted option texts. */
export function questionContentHash(stem: string, options: string[] = []): string {
  const norm = [normalizeText(stem), ...options.map(normalizeText).sort()].join("|");
  return createHash("sha256").update(norm).digest("hex");
}
