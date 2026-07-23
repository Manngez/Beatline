import type { Song } from "../types";

export type SongLinkService = "spotify" | "youtube" | "apple";

export function spotifySearchUrl(song: Song): string {
  // Search URL opens the track picker in Spotify app/web – same idea as Hitster cards
  const q = encodeURIComponent(`track:${song.title} artist:${song.artist}`);
  return `https://open.spotify.com/search/${q}`;
}

/** Deep link that prefers the Spotify app on mobile */
export function spotifyAppUrl(song: Song): string {
  const q = encodeURIComponent(`${song.title} ${song.artist}`);
  return `https://open.spotify.com/search/${q}`;
}

export function youtubeSearchUrl(song: Song): string {
  const q = encodeURIComponent(`${song.artist} ${song.title} audio`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

export function appleMusicSearchUrl(song: Song): string {
  const q = encodeURIComponent(`${song.artist} ${song.title}`);
  return `https://music.apple.com/search?term=${q}`;
}

export function songLinkForService(song: Song, service: SongLinkService): string {
  switch (service) {
    case "spotify":
      return spotifyAppUrl(song);
    case "youtube":
      return youtubeSearchUrl(song);
    case "apple":
      return appleMusicSearchUrl(song);
  }
}

export function qrImageUrl(data: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(data)}`;
}

export const LINK_SERVICE_META: Record<
  SongLinkService,
  { label: string; emoji: string; color: string; hint: string }
> = {
  spotify: {
    label: "Spotify",
    emoji: "🟢",
    color: "#1DB954",
    hint: "Som i riktiga Hitster – skanna och spela i Spotify",
  },
  youtube: {
    label: "YouTube",
    emoji: "▶️",
    color: "#FF0000",
    hint: "Öppnar sökresultat för låten på YouTube",
  },
  apple: {
    label: "Apple Music",
    emoji: "🍎",
    color: "#fc3c44",
    hint: "Öppnar sök i Apple Music",
  },
};
