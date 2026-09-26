"use client";
import { useState } from "react";
import { formatBytes } from "@/lib/utils";

const MAX = 25 * 1024 * 1024;

/** PDF file picker with an early size/type check; the server re-validates everything. */
export function PdfInput({ required }: { required?: boolean }) {
  const [info, setInfo] = useState<{ text: string; bad: boolean } | null>(null);
  return (
    <div>
      <input
        id="file" name="file" type="file" accept="application/pdf,.pdf" required={required}
        className="block w-full text-sm file:mr-3 file:h-9 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:text-sm file:font-medium"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          let msg = "";
          if (f && !/\.pdf$/i.test(f.name)) msg = "Only PDF files can be uploaded.";
          else if (f && f.size > MAX) msg = "PDF files must be 25 MB or smaller.";
          e.currentTarget.setCustomValidity(msg);
          setInfo(f ? { text: msg || `${f.name} · ${formatBytes(f.size)}`, bad: !!msg } : null);
        }}
      />
      {info && <p className={`mt-1 text-xs ${info.bad ? "text-danger" : "text-muted"}`} role={info.bad ? "alert" : undefined}>{info.text}</p>}
    </div>
  );
}
