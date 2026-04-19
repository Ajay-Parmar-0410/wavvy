"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Play } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { toast } from "@/stores/toastStore";
import { db } from "@/lib/db";
import type { Song } from "@/types";

interface RecommendedForPlaylistProps {
  playlistId: string;
  seedSongs: Song[];
  onSongAdded?: (song: Song) => void;
}

/**
 * "Based on what's in this playlist" — mirrors Spotify's recommended section
 * below the track table. We use the artist of the last seed song as the
 * search query against the existing Saavn proxy, filter out songs already in
 * the playlist, and surface up to 8 results with an inline "Add" action.
 */
export default function RecommendedForPlaylist({
  playlistId,
  seedSongs,
  onSongAdded,
}: RecommendedForPlaylistProps) {
  const playSong = usePlayerStore((s) => s.playSong);
  const [recs, setRecs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seed = seedSongs[seedSongs.length - 1];
    if (!seed) {
      setLoading(false);
      return;
    }
    const existingIds = new Set(seedSongs.map((s) => s.id));
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/saavn/search?q=${encodeURIComponent(seed.artist)}`,
          { signal: controller.signal }
        );
        const json = await res.json();
        if (json.success) {
          const filtered: Song[] = (json.data.songs || [])
            .filter((s: Song) => !existingIds.has(s.id))
            .slice(0, 8);
          setRecs(filtered);
        }
      } catch {
        // fail silently — section is optional
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [seedSongs]);

  if (loading) {
    return (
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-1">
          Recommended
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Based on what&rsquo;s in this playlist
        </p>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-bg-tertiary rounded animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (recs.length === 0) return null;

  const handleAdd = async (song: Song) => {
    try {
      const current = await db.playlists.get(playlistId);
      if (!current) return;
      if (current.songs.some((s) => s.id === song.id)) {
        toast.info("Already in this playlist");
        return;
      }
      await db.playlists.update(playlistId, {
        songs: [...current.songs, song],
        updatedAt: Date.now(),
      });
      setRecs((cur) => cur.filter((s) => s.id !== song.id));
      onSongAdded?.(song);
      toast.success(`Added "${song.title}"`);
    } catch {
      toast.error("Couldn't add to playlist");
    }
  };

  return (
    <section className="mt-12">
      <h2 className="font-heading text-xl font-bold text-text-primary mb-1">
        Recommended
      </h2>
      <p className="text-sm text-text-secondary mb-4">
        Based on what&rsquo;s in this playlist
      </p>
      <ul className="space-y-1">
        {recs.map((song) => (
          <li
            key={song.id}
            className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-tertiary transition-colors"
          >
            <button
              type="button"
              onClick={() => playSong(song, recs, recs.indexOf(song))}
              aria-label={`Play "${song.title}"`}
              className="relative w-10 h-10 rounded overflow-hidden bg-bg-tertiary flex-shrink-0"
            >
              {song.image && (
                <Image
                  src={song.image}
                  alt={song.title}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              )}
              <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white" />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary truncate">{song.title}</p>
              <p className="text-xs text-text-secondary truncate">
                {song.artist}
              </p>
            </div>
            <span className="text-xs text-text-muted w-32 truncate hidden md:block">
              {song.album}
            </span>
            <button
              type="button"
              onClick={() => handleAdd(song)}
              aria-label={`Add "${song.title}" to playlist`}
              className="px-3 py-1 rounded-full border border-border text-text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 hover:border-text-primary transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
