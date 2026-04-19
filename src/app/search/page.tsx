"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/layout/SearchBar";
import SongRow from "@/components/song/SongRow";
import RecentSearches from "@/components/search/RecentSearches";
import StartBrowsing from "@/components/search/StartBrowsing";
import BrowseAllGrid from "@/components/search/BrowseAllGrid";
import { SongRowSkeleton, SongCardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { Song, Album, Artist } from "@/types";

type Tab = "all" | "songs" | "albums" | "artists" | "youtube";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "songs", label: "Songs" },
  { key: "albums", label: "Albums" },
  { key: "artists", label: "Artists" },
  { key: "youtube", label: "YouTube" },
];

interface SearchData {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  ytSongs: Song[];
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <SearchBar />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <SongRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [results, setResults] = useState<SearchData>({ songs: [], albums: [], artists: [], ytSongs: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // Fetch both sources in parallel
      const [saavnRes, ytRes] = await Promise.allSettled([
        fetch(`/api/saavn/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
        fetch(`/api/yt/search?q=${encodeURIComponent(q)}`).then((r) => r.json()),
      ]);

      const saavnData =
        saavnRes.status === "fulfilled" && saavnRes.value.success
          ? saavnRes.value.data
          : { songs: [], albums: [], artists: [] };

      const ytSongs =
        ytRes.status === "fulfilled" && ytRes.value.success
          ? ytRes.value.data.songs
          : [];

      setResults({ ...saavnData, ytSongs });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      fetchResults(query);
    }
  }, [query, fetchResults]);

  const hasResults = results.songs.length > 0 || results.albums.length > 0 || results.artists.length > 0 || results.ytSongs.length > 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <SearchBar />
      </div>

      {/* Tabs */}
      {searched && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === key
                  ? "bg-text-primary text-bg-primary"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div>
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <SongRowSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && searched && hasResults && (
        <div className="space-y-8">
          {/* Songs */}
          {(activeTab === "all" || activeTab === "songs") && results.songs.length > 0 && (
            <section>
              {activeTab === "all" && (
                <h2 className="font-heading text-lg font-semibold text-text-primary mb-3">
                  Songs
                </h2>
              )}
              <div className="space-y-0.5">
                {results.songs.map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={i}
                    showIndex
                    queue={results.songs}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {(activeTab === "all" || activeTab === "albums") && results.albums.length > 0 && (
            <section>
              {activeTab === "all" && (
                <h2 className="font-heading text-lg font-semibold text-text-primary mb-3">
                  Albums
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {results.albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.id}`}
                    className="group flex flex-col gap-2 p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden bg-bg-tertiary">
                      {album.image && (
                        <Image
                          src={album.image}
                          alt={album.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 200px"
                        />
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {album.name}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {album.artist} {album.year ? `· ${album.year}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {(activeTab === "all" || activeTab === "artists") && results.artists.length > 0 && (
            <section>
              {activeTab === "all" && (
                <h2 className="font-heading text-lg font-semibold text-text-primary mb-3">
                  Artists
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {results.artists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artist/${artist.id}`}
                    className="group flex flex-col items-center gap-2 p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="relative w-28 h-28 rounded-full overflow-hidden bg-bg-tertiary">
                      {artist.image && (
                        <Image
                          src={artist.image}
                          alt={artist.name}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary truncate text-center w-full">
                      {artist.name}
                    </p>
                    <p className="text-xs text-text-secondary">Artist</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* YouTube */}
          {(activeTab === "all" || activeTab === "youtube") && results.ytSongs.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold text-text-primary mb-3">
                YouTube
              </h2>
              <div className="space-y-0.5">
                {results.ytSongs.map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={i}
                    queue={results.ytSongs}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && !hasResults && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-2">
            No results found
          </h2>
          <p className="text-text-secondary text-sm max-w-sm">
            Try a different search term.
          </p>
        </div>
      )}

      {/* Initial state — Spotify-style Recent searches + Start browsing + Browse all */}
      {!searched && (
        <div className="space-y-8">
          <RecentSearches />
          <StartBrowsing />
          <BrowseAllGrid />
        </div>
      )}
    </div>
  );
}
