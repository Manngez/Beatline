import type { Raw } from "./catalog";

export type AdminSongCategory = "pop" | "rock" | "rap" | "swedish";
export type AdminSongRow = [title: string, artist: string, year: number, category: AdminSongCategory];

// Den här filen uppdateras av Beatline Admin och versionshanteras i GitHub.
export const ADMIN_SONGS: AdminSongRow[] = [
];

export function adminRowsFor(category: AdminSongCategory): Raw[] {
  return ADMIN_SONGS
    .filter((row) => row[3] === category)
    .map(([title, artist, year]) => [title, artist, year]);
}
