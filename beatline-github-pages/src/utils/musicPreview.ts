import type { Song } from "../types";

export type PreviewSource = "itunes" | "deezer";

export interface PreviewResult {
  url: string;
  source: PreviewSource;
  trackName?: string;
  artistName?: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(
  song: Song,
  trackName: string,
  artistName: string
): number {
  const t = normalize(trackName);
  const a = normalize(artistName);
  const wantT = normalize(song.title);
  const wantA = normalize(song.artist.split(/[,&/]|ft\.|feat\./i)[0]);

  let score = 0;
  if (t === wantT) score += 50;
  else if (t.includes(wantT) || wantT.includes(t)) score += 30;
  else {
    // token overlap
    const tw = new Set(t.split(" "));
    const ww = wantT.split(" ").filter((w) => w.length > 2);
    const hits = ww.filter((w) => tw.has(w)).length;
    score += hits * 8;
  }

  if (a.includes(wantA) || wantA.includes(a)) score += 40;
  else {
    const aw = new Set(a.split(" "));
    const ww = wantA.split(" ").filter((w) => w.length > 2);
    const hits = ww.filter((w) => aw.has(w)).length;
    score += hits * 10;
  }

  return score;
}

async function fetchItunes(song: Song): Promise<PreviewResult | null> {
  const queries = [
    `${song.artist} ${song.title}`,
    `${song.title} ${song.artist.split(/[,&/]|ft\.|feat\./i)[0]}`,
    song.title,
  ];

  for (const q of queries) {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=12&country=SE`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const results = (data.results ?? []) as Array<{
        trackName?: string;
        artistName?: string;
        previewUrl?: string;
        trackTimeMillis?: number;
      }>;

      const ranked = results
        .filter((r) => r.previewUrl && r.trackName)
        .map((r) => ({
          r,
          score: scoreMatch(song, r.trackName!, r.artistName ?? ""),
        }))
        .filter((x) => x.score >= 30)
        .sort((a, b) => b.score - a.score);

      if (ranked[0]) {
        return {
          url: ranked[0].r.previewUrl!,
          source: "itunes",
          trackName: ranked[0].r.trackName,
          artistName: ranked[0].r.artistName,
        };
      }
    } catch {
      // try next query
    }
  }
  return null;
}

async function fetchDeezer(song: Song): Promise<PreviewResult | null> {
  const queries = [
    `artist:"${song.artist.split(/[,&/]|ft\.|feat\./i)[0].trim()}" track:"${song.title}"`,
    `${song.artist} ${song.title}`,
    song.title,
  ];

  for (const q of queries) {
    try {
      // jsonp-less CORS: Deezer often blocks browser CORS; use a public proxy fallback via itunes only if fails
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=12`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const results = (data.data ?? []) as Array<{
        title?: string;
        preview?: string;
        artist?: { name?: string };
      }>;

      const ranked = results
        .filter((r) => r.preview && r.title)
        .map((r) => ({
          r,
          score: scoreMatch(song, r.title!, r.artist?.name ?? ""),
        }))
        .filter((x) => x.score >= 30)
        .sort((a, b) => b.score - a.score);

      if (ranked[0]?.r.preview) {
        return {
          url: ranked[0].r.preview,
          source: "deezer",
          trackName: ranked[0].r.title,
          artistName: ranked[0].r.artist?.name,
        };
      }
    } catch {
      // continue
    }
  }
  return null;
}

/** Resolve best free 30s preview (real recording, not MIDI) */
export async function resolvePreview(song: Song): Promise<PreviewResult | null> {
  // Prefer iTunes (reliable CORS + real previews)
  const itunes = await fetchItunes(song);
  if (itunes) return itunes;

  // Deezer fallback (may fail due to CORS in some environments)
  const deezer = await fetchDeezer(song);
  if (deezer) return deezer;

  return null;
}

export { spotifySearchUrl, youtubeSearchUrl } from "./songLinks";

/** Test that an audio URL actually plays */
export function probeAudio(url: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    audio.preload = "auto";
    audio.oncanplaythrough = () => {
      window.clearTimeout(timer);
      finish(true);
    };
    audio.onloadeddata = () => {
      // enough to attempt play
    };
    audio.onerror = () => {
      window.clearTimeout(timer);
      finish(false);
    };
    audio.src = url;
    audio.load();
  });
}
