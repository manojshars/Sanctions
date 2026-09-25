/** YouTube helpers. IDs are 11 characters from [A-Za-z0-9_-]. */
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isValidYouTubeId(id: string): boolean {
  return ID_RE.test(id);
}

/** Extracts a video ID from common YouTube URL formats or a bare ID. Returns null if none. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (isValidYouTubeId(s)) return s;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/);
      if (m) id = m[2];
    }
  }
  return id && isValidYouTubeId(id) ? id : null;
}

export interface OEmbedResult {
  reachable: boolean;
  exists: boolean;
  title?: string;
  authorName?: string;
  authorUrl?: string;
  error?: string;
}

/**
 * Verifies a video via YouTube's public oEmbed endpoint (no API key needed).
 * `reachable: false` means the check could not be performed (network policy, outage) — not that the video is invalid.
 */
export async function fetchOEmbed(id: string, fetchImpl: typeof fetch = fetch): Promise<OEmbedResult> {
  if (!isValidYouTubeId(id)) return { reachable: true, exists: false, error: "Invalid video ID format" };
  try {
    const res = await fetchImpl(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 404 || res.status === 400) return { reachable: true, exists: false, error: "Video not found or private" };
    if (res.status === 401 || res.status === 403) return { reachable: true, exists: true, error: "Video exists but embedding is restricted" };
    if (!res.ok) return { reachable: false, exists: false, error: `YouTube responded ${res.status}` };
    const j = (await res.json()) as { title?: string; author_name?: string; author_url?: string };
    return { reachable: true, exists: true, title: j.title, authorName: j.author_name, authorUrl: j.author_url };
  } catch (e) {
    return { reachable: false, exists: false, error: `Could not reach YouTube: ${(e as Error).message}` };
  }
}
