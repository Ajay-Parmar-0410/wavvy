"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Music2, Play, Heart } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useHistory } from "@/hooks/useHistory";
import { usePlaylists } from "@/hooks/usePlaylist";
import { SongCardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { Song, Album, Playlist } from "@/types";

interface TrendingData {
  trending: Song[];
  albums: Album[];
  playlists: { id: string; name: string; image: string; imageHq: string }[];
}

type Chip = "All" | "Music" | "Podcasts";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface JumpItem {
  id: string;
  href: string;
  title: string;
  image?: string;
  fallback?: React.ReactNode;
}

export default function HomePage() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState<Chip>("All");

  const { history } = useHistory();
  const { playlists } = usePlaylists();
  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/saavn/trending");
        const json = await res.json();
        if (!cancelled && json.success) {
          setData(json.data);
        }
      } catch {
        // fail silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const jumpBackIn: JumpItem[] = useMemo(() => {
    const items: JumpItem[] = [];
    // Pinned / default playlist first
    const pinned: Playlist | undefined = playlists.find((p) => p.isDefault);
    if (pinned) {
      items.push({
        id: `playlist-${pinned.id}`,
        href: `/playlist/${pinned.id}`,
        title: pinned.name,
        fallback: (
          <div className="w-full h-full bg-gradient-to-br from-accent-secondary to-accent-primary flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
        ),
      });
    }
    // Most-recent history songs
    const seen = new Set<string>();
    for (const entry of history) {
      if (items.length >= 8) break;
      if (seen.has(entry.song.id)) continue;
      seen.add(entry.song.id);
      if (entry.song.album && entry.song.albumId) {
        items.push({
          id: `album-${entry.song.albumId}`,
          href: `/album/${entry.song.albumId}`,
          title: entry.song.album,
          image: entry.song.image,
        });
      } else {
        items.push({
          id: `song-${entry.song.id}`,
          href: `/song/${entry.song.id}`,
          title: entry.song.title,
          image: entry.song.image,
        });
      }
    }
    // Top of remaining custom playlists
    const nonDefault = playlists.filter((p) => !p.isDefault);
    for (const p of nonDefault) {
      if (items.length >= 8) break;
      items.push({
        id: `playlist-${p.id}`,
        href: `/playlist/${p.id}`,
        title: p.name,
        image: p.songs[0]?.image,
      });
    }
    return items.slice(0, 8);
  }, [history, playlists]);

  const handleQuickPlay = (song: Song, queue: Song[], index: number) => {
    playSong(song, queue, index);
  };

  return (
    <div className="p-6">
      {/* Greeting + chips */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-5">
          {(["All", "Music", "Podcasts"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChip(c)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                chip === c
                  ? "bg-text-primary text-bg-primary"
                  : "bg-bg-tertiary text-text-primary hover:bg-bg-hover"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">
          {getGreeting()}
        </h1>
      </div>

      {/* Jump back in — 2-col rectangular tiles */}
      {jumpBackIn.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-10">
          {jumpBackIn.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-center gap-3 bg-bg-hover/60 hover:bg-bg-pressed rounded-md overflow-hidden transition-colors"
            >
              <div className="relative w-16 h-16 flex-shrink-0 bg-bg-tertiary">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  item.fallback ?? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-text-muted" />
                    </div>
                  )
                )}
              </div>
              <span className="text-sm font-semibold text-text-primary truncate pr-4">
                {item.title}
              </span>
              <span className="ml-auto mr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 text-bg-primary fill-current ml-0.5" />
                </span>
              </span>
            </Link>
          ))}
        </section>
      )}

      {loading && (
        <div className="space-y-8">
          <section>
            <div className="h-6 w-48 bg-bg-tertiary rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SongCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-10">
          {/* Today's biggest hits */}
          {data.trending.length > 0 && (
            <Rail title="Today's biggest hits" seeAllHref="/search?q=trending">
              {data.trending.slice(0, 12).map((song, i) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() =>
                      handleQuickPlay(song, data.trending, i)
                    }
                    className="group cursor-pointer flex-shrink-0 w-40 p-3 rounded-lg bg-bg-tertiary/70 hover:bg-bg-hover transition-colors"
                  >
                    <div className="relative aspect-square rounded-md overflow-hidden bg-bg-tertiary mb-3">
                      {song.image && (
                        <Image
                          src={song.image}
                          alt={song.title}
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      )}
                      <span
                        className={cn(
                          "absolute bottom-2 right-2 w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-lg transition-all",
                          "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                        )}
                      >
                        <Play className="w-4 h-4 text-bg-primary fill-current ml-0.5" />
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isCurrent ? "text-accent-primary" : "text-text-primary"
                      )}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                );
              })}
            </Rail>
          )}

          {/* New Releases */}
          {data.albums.length > 0 && (
            <Rail title="New releases for you" seeAllHref="/search?q=new">
              {data.albums.slice(0, 12).map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.id}`}
                  className="group flex-shrink-0 w-40 p-3 rounded-lg bg-bg-tertiary/70 hover:bg-bg-hover transition-colors"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden bg-bg-tertiary mb-3">
                    {album.image && (
                      <Image
                        src={album.image}
                        alt={album.name}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    )}
                    <span className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                      <Play className="w-4 h-4 text-bg-primary fill-current ml-0.5" />
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {album.name}
                  </p>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {album.artist}
                  </p>
                </Link>
              ))}
            </Rail>
          )}

          {/* Featured Playlists */}
          {data.playlists.length > 0 && (
            <Rail title="Featured playlists" seeAllHref="/search?q=playlists">
              {data.playlists.slice(0, 12).map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  className="group flex-shrink-0 w-40 p-3 rounded-lg bg-bg-tertiary/70 hover:bg-bg-hover transition-colors"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden bg-bg-tertiary mb-3">
                    {playlist.image && (
                      <Image
                        src={playlist.image}
                        alt={playlist.name}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    )}
                    <span className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                      <Play className="w-4 h-4 text-bg-primary fill-current ml-0.5" />
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {playlist.name}
                  </p>
                </Link>
              ))}
            </Rail>
          )}
        </div>
      )}

      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
            <Music2 className="w-10 h-10 text-text-muted" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-2">
            Welcome to Wavvy
          </h2>
          <p className="text-text-secondary text-sm max-w-sm">
            Search for your favorite songs, albums, and artists.
          </p>
        </div>
      )}
    </div>
  );
}

interface RailProps {
  title: string;
  seeAllHref?: string;
  children: React.ReactNode;
}

function Rail({ title, seeAllHref, children }: RailProps) {
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary hover:underline cursor-pointer">
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-xs font-semibold text-text-secondary hover:underline"
          >
            Show all
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {children}
      </div>
    </section>
  );
}
