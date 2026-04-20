"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search as SearchIcon, X } from "lucide-react";
import { toast } from "@/stores/toastStore";
import { db } from "@/lib/db";
import { enrichSong } from "@/lib/enrichSong";
import type { Song } from "@/types";

interface PlaylistSongSearchProps {
  playlistId: string;
  existingSongIds: Set<string>;
  onSongAdded: (song: Song) => void;
  onClose?: () => void;
}

export default function PlaylistSongSearch({
  playlistId,
  existingSongIds,
  onSongAdded,
  onClose,
}: PlaylistSongSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/saavn/search?q=${encodeURIComponent(q)}&type=songs`,
          { signal: controller.signal }
        );
        const json = await res.json();
        if (json.success) {
          const songs: Song[] = json.data.songs || [];
          setResults(songs.slice(0, 10));
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // fail silently
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleAdd = async (song: Song) => {
    if (existingSongIds.has(song.id)) {
      toast.info("Already in this playlist");
      return;
    }
    setAdding(song.id);
    try {
      const fullSong = await enrichSong(song);
      const current = await db.playlists.get(playlistId);
      if (!current) return;
      if (current.songs.some((s) => s.id === song.id)) {
        toast.info("Already in this playlist");
        return;
      }
      await db.playlists.update(playlistId, {
        songs: [...current.songs, fullSong],
        updatedAt: Date.now(),
      });
      onSongAdded(fullSong);
      toast.success(`Added "${song.title}"`);
    } catch {
      toast.error("Couldn't add to playlist");
    } finally {
      setAdding(null);
    }
  };

  return (
    <section
      aria-label="Add songs to playlist"
      className="mt-8 rounded-lg bg-bg-secondary/60 border border-border p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-text-primary">
            Let&rsquo;s find something for your playlist
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mt-4 relative">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs or episodes"
          className="w-full pl-9 pr-3 py-2.5 rounded-md bg-bg-tertiary border border-border text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-accent-primary/50 transition-colors"
        />
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-bg-tertiary/60 rounded animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="mt-4 text-sm text-text-muted">No results found.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 space-y-1">
          {results.map((song) => {
            const alreadyAdded = existingSongIds.has(song.id);
            const isAdding = adding === song.id;
            return (
              <li
                key={song.id}
                className="group flex items-center gap-3 px-2 py-2 rounded-md hover:bg-bg-tertiary/80 transition-colors"
              >
                <div className="relative w-10 h-10 rounded overflow-hidden bg-bg-tertiary flex-shrink-0">
                  {song.image && (
                    <Image
                      src={song.image}
                      alt={song.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate">
                    {song.title}
                  </p>
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
                  disabled={alreadyAdded || isAdding}
                  aria-label={
                    alreadyAdded
                      ? `"${song.title}" already added`
                      : `Add "${song.title}"`
                  }
                  className="px-3 py-1 rounded-full border border-border text-text-primary text-xs font-semibold hover:border-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {alreadyAdded ? "Added" : isAdding ? "Adding…" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
