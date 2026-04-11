import Dexie, { type EntityTable } from "dexie";
import type { Playlist, HistoryEntry, Song } from "@/types";

interface DownloadMeta {
  id: string;
  song: Song;
  quality: string;
  cachedAt: number;
  size?: number;
}

const db = new Dexie("wavvy-db") as Dexie & {
  playlists: EntityTable<Playlist, "id">;
  history: EntityTable<HistoryEntry, "id">;
  downloads: EntityTable<DownloadMeta, "id">;
};

db.version(1).stores({
  playlists: "id, name, createdAt, updatedAt",
  history: "++id, playedAt, song.id",
  downloads: "id, cachedAt",
});

export { db };
export type { DownloadMeta };

export async function ensureDefaultPlaylist(): Promise<void> {
  const liked = await db.playlists.get("liked-songs");
  if (!liked) {
    await db.playlists.add({
      id: "liked-songs",
      name: "Liked Songs",
      description: "Songs you've liked",
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: true,
    });
  }
}
