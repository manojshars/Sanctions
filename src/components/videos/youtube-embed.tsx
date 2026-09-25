"use client";
import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";

/** Privacy-enhanced, click-to-load YouTube embed with an "Open on YouTube" fallback. */
export function YouTubeEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  const [active, setActive] = useState(false);
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`;
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-navy">
        {active ? (
          <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0`}
            title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play video: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" loading="lazy" />
            <span className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-gold-400 text-navy shadow-lift transition group-hover:scale-105"><Play className="ml-1 h-7 w-7 fill-current" /></span></span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        Video hosted by YouTube; loads only when you press play. If it doesn&apos;t play (embedding may be restricted),{" "}
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">open on YouTube <ExternalLink className="h-3 w-3" /></a>.
      </p>
    </div>
  );
}
