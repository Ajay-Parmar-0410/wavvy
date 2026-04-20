"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import {
  addRecentSearch,
  recentFromAlbum,
  recentFromArtist,
  recentFromQuery,
  recentFromSong,
} from "@/lib/recentSearches";
import type { Song, Album, Artist } from "@/types";

interface Suggestions {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}

const EMPTY: Suggestions = { songs: [], albums: [], artists: [] };

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const playSong = usePlayerStore((s) => s.playSong);

  // Debounced fetch of suggestions
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions(EMPTY);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/saavn/search?q=${encodeURIComponent(trimmed)}&type=autocomplete`,
          { signal: ctrl.signal }
        );
        const json = await res.json();
        if (json.success) {
          setSuggestions({
            songs: (json.data.songs || []).slice(0, 6),
            albums: (json.data.albums || []).slice(0, 3),
            artists: (json.data.artists || []).slice(0, 3),
          });
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions(EMPTY);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        addRecentSearch(recentFromQuery(trimmed));
        setShowDropdown(false);
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [query, router]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setSuggestions(EMPTY);
    setShowDropdown(false);
  }, []);

  const handlePickSong = useCallback(
    (song: Song) => {
      setShowDropdown(false);
      addRecentSearch(recentFromSong(song));
      playSong(song, suggestions.songs, suggestions.songs.indexOf(song));
    },
    [playSong, suggestions.songs]
  );

  const handlePickAlbum = useCallback(
    (album: Album) => {
      setShowDropdown(false);
      addRecentSearch(recentFromAlbum(album));
      router.push(`/album/${album.id}`);
    },
    [router]
  );

  const handlePickArtist = useCallback(
    (artist: Artist) => {
      setShowDropdown(false);
      addRecentSearch(recentFromArtist(artist));
      router.push(`/artist/${artist.id}`);
    },
    [router]
  );

  const hasSuggestions =
    suggestions.songs.length > 0 ||
    suggestions.albums.length > 0 ||
    suggestions.artists.length > 0;

  const open = showDropdown && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2.5 bg-bg-tertiary border transition-colors",
            isFocused ? "border-accent-primary/50" : "border-transparent"
          )}
        >
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              setShowDropdown(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="Search songs, albums, artists..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          {loading && (
            <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {!loading && !hasSuggestions && (
            <div className="px-4 py-3 text-sm text-text-muted">
              No matches yet — press Enter to search
            </div>
          )}

          {suggestions.songs.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Songs
              </div>
              {suggestions.songs.map((song) => (
                <div
                  key={song.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handlePickSong(song)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.shiftKey) {
                      e.preventDefault();
                      setAddToPlaylistSong(song);
                      return;
                    }
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePickSong(song);
                    }
                  }}
                  className="group w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  <div className="relative w-9 h-9 rounded overflow-hidden bg-bg-tertiary flex-shrink-0">
                    {song.image && (
                      <Image
                        src={song.image}
                        alt={song.title}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-text-primary truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {song.artist}
                    </p>
                  </div>
                  {/* Plan2 §2.1 / feedback #1 — inline add-to-playlist. Does
                     NOT dismiss the dropdown (per user spec). */}
                  <button
                    type="button"
                    aria-label={`Add "${song.title}" to playlist`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddToPlaylistSong(song);
                    }}
                    className="p-1.5 rounded-full text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {suggestions.albums.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Albums
              </div>
              {suggestions.albums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => handlePickAlbum(album)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-tertiary transition-colors text-left"
                >
                  <div className="relative w-9 h-9 rounded overflow-hidden bg-bg-tertiary flex-shrink-0">
                    {album.image && (
                      <Image
                        src={album.image}
                        alt={album.name}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {album.name}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {album.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {suggestions.artists.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Artists
              </div>
              {suggestions.artists.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => handlePickArtist(artist)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-tertiary transition-colors text-left"
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-bg-tertiary flex-shrink-0">
                    {artist.image && (
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {artist.name}
                    </p>
                    <p className="text-xs text-text-secondary">Artist</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {hasSuggestions && (
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full px-4 py-2 text-sm text-accent-primary hover:bg-bg-tertiary transition-colors border-t border-border text-left"
            >
              See all results for &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}

      <AddToPlaylistModal
        isOpen={!!addToPlaylistSong}
        song={addToPlaylistSong}
        onClose={() => setAddToPlaylistSong(null)}
      />
    </div>
  );
}
