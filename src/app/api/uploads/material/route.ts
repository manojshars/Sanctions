import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { blobStorageEnabled, DIRECT_MATERIAL_FOLDER, MAX_MATERIAL_BYTES } from "@/lib/storage";

/**
 * Issues short-lived Vercel Blob client-upload tokens so staff can upload training-material PDFs
 * larger than Vercel's 4.5 MB request limit. The file is validated again when the form is saved.
 */
export async function POST(request: Request) {
  if (!blobStorageEnabled()) return NextResponse.json({ error: "Direct uploads are not enabled" }, { status: 404 });
  const user = await getCurrentUser();
  if (!user || !can(user.role, "content:manage")) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(DIRECT_MATERIAL_FOLDER) || !/\.pdf$/i.test(pathname) || pathname.includes("..")) throw new Error("Invalid upload path");
        return { allowedContentTypes: ["application/pdf"], maximumSizeInBytes: MAX_MATERIAL_BYTES, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
