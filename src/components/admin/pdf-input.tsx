"use client";
import { useState } from "react";
import { formatBytes } from "@/lib/utils";

const MAX = 25 * 1024 * 1024;

/**
 * PDF file picker with an early size/type check; the server re-validates everything.
 * With `direct` (Vercel Blob storage), the file is uploaded from the browser as soon as it is chosen,
 * and the form submits only a reference to it — this avoids the platform's request-size limit.
 */
export function PdfInput({ required, direct }: { required?: boolean; direct?: boolean }) {
  const [info, setInfo] = useState<{ text: string; bad: boolean } | null>(null);
  const [blob, setBlob] = useState<{ pathname: string; filename: string } | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const f = input.files?.[0];
    setBlob(null);
    let msg = "";
    if (f && !/\.pdf$/i.test(f.name)) msg = "Only PDF files can be uploaded.";
    else if (f && f.size > MAX) msg = "PDF files must be 25 MB or smaller.";
    input.setCustomValidity(msg);
    setInfo(f ? { text: msg || `${f.name} · ${formatBytes(f.size)}`, bad: !!msg } : null);
    if (!f || msg || !direct) return;

    input.setCustomValidity("Please wait for the upload to finish.");
    try {
      const { upload } = await import("@vercel/blob/client");
      const safe = f.name.replace(/[^\w.\- ]+/g, "_");
      const r = await upload(`materials/${safe}`, f, {
        access: "private", contentType: "application/pdf", handleUploadUrl: "/api/uploads/material",
        onUploadProgress: ({ percentage }) => setInfo({ text: `Uploading ${f.name} · ${Math.round(percentage)}%`, bad: false }),
      });
      setBlob({ pathname: r.pathname, filename: f.name });
      input.setCustomValidity("");
      setInfo({ text: `${f.name} · ${formatBytes(f.size)} · uploaded — save to finish`, bad: false });
    } catch (err) {
      const m = `Upload failed: ${err instanceof Error ? err.message : "please try again"}`;
      input.setCustomValidity(m);
      setInfo({ text: m, bad: true });
    }
  }

  return (
    <div>
      <input
        id="file" name={direct ? undefined : "file"} type="file" accept="application/pdf,.pdf" required={required}
        className="block w-full text-sm file:mr-3 file:h-9 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:text-sm file:font-medium"
        onChange={onChange}
      />
      {blob && <><input type="hidden" name="blobPathname" value={blob.pathname} /><input type="hidden" name="blobFilename" value={blob.filename} /></>}
      {info && <p className={`mt-1 text-xs ${info.bad ? "text-danger" : "text-muted"}`} role={info.bad ? "alert" : "status"}>{info.text}</p>}
    </div>
  );
}
