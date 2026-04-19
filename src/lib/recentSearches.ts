import type { Song, Album, Artist } from "@/types";

export type RecentSearchEntry =
  | { kind: "song"; id: string; title: string; subtitle: string; image?: string }
  | { kind: "album"; id: string; title: string; subtitle: string; image?: string }
  | { kind: "artist"; id: string; title: string; subtitle: string; image?: string }
  | { kind: "query"; id: string; title: string; subtitle: string };

const STORAGE_KEY = "wavvy:recent-searches";
const MAX_ENTRIES = 10;

function readAll(): RecentSearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentSearchEntry =>
        e && typeof e === "object" && typeof e.id === "string" && typeof e.kind === "string"
    );
  } catch {
    return [];
  }
}

function writeAll(entries: RecentSearchEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // storage unavailable — ignore
  }
}

export function getRecentSearches(): RecentSearchEntry[] {
  return readAll();
}

export function addRecentSearch(entry: RecentSearchEntry): RecentSearchEntry[] {
  const existing = readAll().filter((e) => !(e.kind === entry.kind && e.id === entry.id));
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  writeAll(next);
  return next;
}

export function removeRecentSearch(kind: RecentSearchEntry["kind"], id: string): RecentSearchEntry[] {
  const next = readAll().filter((e) => !(e.kind === kind && e.id === id));
  writeAll(next);
  return next;
}

export function clearRecentSearches(): void {
  writeAll([]);
}

export function recentFromSong(song: Song): RecentSearchEntry {
  return {
    kind: "song",
    id: song.id,
    title: song.title,
    subtitle: song.artist,
    image: song.image,
  };
}

export function recentFromAlbum(album: Album): RecentSearchEntry {
  return {
    kind: "album",
    id: album.id,
    title: album.name,
    subtitle: album.artist,
    image: album.image,
  };
}

export function recentFromArtist(artist: Artist): RecentSearchEntry {
  return {
    kind: "artist",
    id: artist.id,
    title: artist.name,
    subtitle: "Artist",
    image: artist.image,
  };
}

export function recentFromQuery(query: string): RecentSearchEntry {
  const trimmed = query.trim();
  return {
    kind: "query",
    id: trimmed.toLowerCase(),
    title: trimmed,
    subtitle: "Search",
  };
}
