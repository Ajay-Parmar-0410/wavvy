"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Music2 } from "lucide-react";
import SearchBar from "@/components/layout/SearchBar";
import SongCard from "@/components/song/SongCard";
import { SongCardSkeleton } from "@/components/ui/Skeleton";
import type { Song, Album } from "@/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface TrendingData {
  trending: Song[];
  albums: Album[];
  playlists: { id: string; name: string; image: string; imageHq: string }[];
}

export default function HomePage() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/saavn/trending");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  return (
    <div className="p-6">
      {/* Mobile search bar */}
      <div className="md:hidden mb-6">
        <SearchBar />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary">
          {getGreeting()}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          What do you want to listen to?
        </p>
      </div>

      {/* Desktop search bar */}
      <div className="hidden md:block mb-8">
        <SearchBar />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-8">
          <section>
            <div className="h-6 w-40 bg-bg-tertiary rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SongCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <div className="space-y-10">
          {/* Trending Songs */}
          {data.trending.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
                Trending Now
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {data.trending.slice(0, 10).map((song, i) => (
                  <SongCard key={song.id} song={song} queue={data.trending} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* New Albums */}
          {data.albums.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
                New Releases
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {data.albums.slice(0, 12).map((album) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.id}`}
                    className="group flex-shrink-0 w-36 sm:w-40 flex flex-col gap-2 p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden bg-bg-tertiary">
                      {album.image && (
                        <Image
                          src={album.image}
                          alt={album.name}
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {album.name}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {album.artist}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Featured Playlists */}
          {data.playlists.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
                Featured Playlists
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {data.playlists.slice(0, 12).map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/playlist/${playlist.id}`}
                    className="group flex-shrink-0 w-36 sm:w-40 flex flex-col gap-2 p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden bg-bg-tertiary">
                      {playlist.image && (
                        <Image
                          src={playlist.image}
                          alt={playlist.name}
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {playlist.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty / Error state */}
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
