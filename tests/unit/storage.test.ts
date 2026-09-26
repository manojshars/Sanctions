import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, Buffer>();
vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (pathname: string, body: Buffer, opts: { access: string }) => {
    expect(opts.access).toBe("private");
    store.set(pathname, Buffer.from(body));
    return { pathname, url: `https://x.private.blob.vercel-storage.com/${pathname}` };
  }),
  get: vi.fn(async (pathname: string) => {
    const b = store.get(pathname);
    return b ? { statusCode: 200, stream: new Response(b).body, blob: {} } : null;
  }),
  del: vi.fn(async (pathname: string) => { store.delete(pathname); }),
}));

import { blobStorageEnabled, deleteObject, directUploadKey, getObject, putObject } from "@/lib/storage";
import { appUrl } from "@/lib/utils";

describe("storage drivers", () => {
  beforeEach(() => { store.clear(); vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_test"); vi.stubEnv("STORAGE_DRIVER", ""); });
  afterEach(() => vi.unstubAllEnvs());

  it("uses private Vercel Blob storage when a token is configured", async () => {
    expect(blobStorageEnabled()).toBe(true);
    const key = await putObject(new TextEncoder().encode("hello"), "txt", "materials");
    expect(key).toMatch(/^blob:materials\/\d{4}-\d{2}\/[0-9a-f]{32}\.txt$/);
    expect((await getObject(key)).toString()).toBe("hello");
    await deleteObject(key);
    await expect(getObject(key)).rejects.toThrow(/not found/);
  });

  it("falls back to local disk without a token or when STORAGE_DRIVER=local", async () => {
    vi.stubEnv("STORAGE_DRIVER", "local");
    expect(blobStorageEnabled()).toBe(false);
    const key = await putObject(new TextEncoder().encode("local"), "txt");
    expect(key.startsWith("blob:")).toBe(false);
    expect((await getObject(key)).toString()).toBe("local");
    await deleteObject(key);
    await expect(getObject("../../etc/passwd")).rejects.toThrow(/Invalid key/);
  });

  it("only accepts direct-upload references inside the materials folder", () => {
    expect(directUploadKey("materials/guide-abc123.pdf")).toBe("blob:materials/guide-abc123.pdf");
    expect(directUploadKey("uploads/2026-09/x.pdf")).toBeNull();
    expect(directUploadKey("materials/../uploads/x.pdf")).toBeNull();
    expect(directUploadKey("materials/script.js")).toBeNull();
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    expect(directUploadKey("materials/guide.pdf")).toBeNull();
  });
});

describe("appUrl", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("prefers APP_URL, then the Vercel production domain", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "fincrime.vercel.app");
    expect(appUrl("/x")).toBe("https://fincrime.vercel.app/x");
    vi.stubEnv("APP_URL", "https://academy.example.com/");
    expect(appUrl("/x")).toBe("https://academy.example.com/x");
  });
});
