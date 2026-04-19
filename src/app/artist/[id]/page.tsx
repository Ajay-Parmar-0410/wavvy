"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, User, CheckCircle2 } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useLikedSongs } from "@/hooks/usePlaylist";
import PlaylistHeader from "@/components/playlist/PlaylistHeader";
import SongRow from "@/components/song/SongRow";
import SongContextMenu from "@/components/song/SongContextMenu";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import { cn, formatTime } from "@/lib/utils";
import type { Artist, Album, Song } from "@/types";

type DiscographyTab = "albums" | "singles";

export default function ArtistPage({ params }: { params: { id: string } }) {
  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const { isLiked, toggleLike } = useLikedSongs();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [singles, setSingles] = useState<Album[]>([]);
  const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [discTab, setDiscTab] = useState<DiscographyTab>("albums");
  const [contextMenu, setContextMenu] = useState<{
    song: Song;
    position: { x: number; y: number };
  } | null>(null);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);

  const loadArtist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/saavn/artist/${params.id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `Artist lookup failed (${res.status})`);
        setLoading(false);
        return;
      }
      setArtist(json.data.artist);
      setTopSongs(json.data.topSongs || []);
      setTopAlbums(json.data.topAlbums || []);
      setSingles(json.data.singles || []);
      setSimilarArtists(json.data.similarArtists || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadArtist();
  }, [loadArtist]);

  const handleContextMenu = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ song, position: { x: e.clientX, y: e.clientY } });
  };

  const isArtistPlaying = useMemo(() => {
    if (!isPlaying || !currentSong) return false;
    return topSongs.some((s) => s.id === currentSong.id);
  }, [isPlaying, currentSong, topSongs]);

  const handlePlayTop = () => {
    if (isArtistPlaying) {
      togglePlay();
      return;
    }
    if (topSongs.length > 0) {
      playSong(topSongs[0], topSongs, 0);
    }
  };

  const visiblePopular = showAllPopular ? topSongs.slice(0, 10) : topSongs.slice(0, 5);
  const discography = discTab === "albums" ? topAlbums : singles;
  const hasDiscography = topAlbums.length > 0 || singles.length > 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end mb-8">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-bg-tertiary" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-16 bg-bg-tertiary rounded" />
              <div className="h-12 w-80 bg-bg-tertiary rounded" />
              <div className="h-4 w-40 bg-bg-tertiary rounded" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 bg-bg-tertiary rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 bg-bg-tertiary rounded" />
                  <div className="h-3 w-1/2 bg-bg-tertiary rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20">
        <User className="w-12 h-12 text-text-muted mb-3" />
        <p className="text-text-muted">
          {error ? `Couldn\u2019t load artist: ${error}` : "Artist not found"}
        </p>
        <button
          onClick={loadArtist}
          className="mt-4 px-4 py-2 rounded-full border border-border text-sm text-text-primary hover:bg-bg-secondary transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PlaylistHeader
        kind="Artist"
        title={artist.name}
        subtitle={
          <span className="inline-flex items-center gap-1.5 text-sm text-text-primary">
            <CheckCircle2 className="w-4 h-4 text-[#4CB3FF] fill-[#4CB3FF]" aria-hidden />
            <span>Verified Artist</span>
          </span>
        }
        meta={artist.bio ? artist.bio : undefined}
        coverUrl={artist.imageHq || artist.image}
        coverFallback={
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-24 h-24 text-text-muted" />
          </div>
        }
        isPlaying={isArtistPlaying}
        onPlay={handlePlayTop}
        disabled={topSongs.length === 0}
        circular
        secondaryActions={
          <button
            type="button"
            className="px-4 py-1.5 rounded-full border border-border text-sm text-text-primary hover:border-text-primary transition-colors"
          >
            Follow
          </button>
        }
      />

      {/* Popular */}
      {topSongs.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary mb-4">
            Popular
          </h2>
          <div className="space-y-0.5">
            {visiblePopular.map((song, i) => {
              const isCurrent = currentSong?.id === song.id;
              const rowPlaying = isCurrent && isPlaying;
              return (
                <div
                  key={song.id}
                  onClick={() => {
                    if (isCurrent) togglePlay();
                    else playSong(song, topSongs, i);
                  }}
                  onContextMenu={(e) => handleContextMenu(song, e)}
                  className={cn(
                    "group grid grid-cols-[24px_64px_1fr_auto] items-center gap-4 px-4 py-2 rounded-md cursor-pointer transition-colors",
                    isCurrent ? "bg-bg-tertiary" : "hover:bg-bg-hover/60"
                  )}
                >
                  <div className="text-sm text-text-muted font-mono relative w-6 h-6 flex items-center justify-center">
                    {rowPlaying ? (
                      <Pause className="w-4 h-4 text-accent-primary fill-current" />
                    ) : (
                      <>
                        <span className="group-hover:hidden">{i + 1}</span>
                        <Play className="w-4 h-4 text-text-primary hidden group-hover:block fill-current" />
                      </>
                    )}
                  </div>
                  <div className="relative w-12 h-12 rounded overflow-hidden bg-bg-tertiary">
                    {song.image && (
                      <Image
                        src={song.image}
                        alt={song.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isCurrent ? "text-accent-primary" : "text-text-primary"
                    )}
                  >
                    {song.title}
                  </p>
                  <span className="text-xs text-text-muted font-mono">
                    {formatTime(song.duration)}
                  </span>
                </div>
              );
            })}
          </div>
          {topSongs.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllPopular((v) => !v)}
              className="mt-3 ml-4 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              {showAllPopular ? "Show less" : "See more"}
            </button>
          )}
        </section>
      )}

      {/* Discography with tabs */}
      {hasDiscography && (
        <section className="mt-10">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary">
              Discography
            </h2>
            <div className="flex items-center gap-2">
              {topAlbums.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDiscTab("albums")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                    discTab === "albums"
                      ? "bg-text-primary text-bg-primary"
                      : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                  )}
                >
                  Albums
                </button>
              )}
              {singles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDiscTab("singles")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                    discTab === "singles"
                      ? "bg-text-primary text-bg-primary"
                      : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                  )}
                >
                  Singles
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {discography.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="group p-3 rounded-lg bg-bg-tertiary/70 hover:bg-bg-hover transition-colors"
              >
                <div className="relative aspect-square rounded-md overflow-hidden bg-bg-tertiary mb-3">
                  {album.imageHq ? (
                    <Image
                      src={album.imageHq}
                      alt={album.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-text-muted" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    <Play className="w-4 h-4 text-bg-primary fill-current ml-0.5" />
                  </span>
                </div>
                <p className="text-sm font-medium text-text-primary truncate">
                  {album.name}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {album.year ? `${album.year} · ` : ""}
                  {discTab === "albums" ? "Album" : "Single"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Fans also like */}
      {similarArtists.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary mb-4">
            Fans also like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {similarArtists.map((a) => (
              <Link
                key={a.id}
                href={`/artist/${a.id}`}
                className="group p-3 rounded-lg bg-bg-tertiary/70 hover:bg-bg-hover transition-colors text-center"
              >
                <div className="relative aspect-square rounded-full overflow-hidden bg-bg-tertiary mb-3 mx-auto">
                  {a.imageHq ? (
                    <Image
                      src={a.imageHq}
                      alt={a.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-text-muted" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-text-primary truncate">
                  {a.name}
                </p>
                <p className="text-xs text-text-muted mt-0.5">Artist</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hidden queue for context-menu interactions using SongRow-based rows elsewhere */}
      <div className="sr-only">
        {topSongs.map((song, i) => (
          <SongRow key={song.id} song={song} index={i} queue={topSongs} />
        ))}
      </div>

      <SongContextMenu
        song={contextMenu?.song ?? null}
        position={contextMenu?.position ?? null}
        isLiked={contextMenu?.song ? isLiked(contextMenu.song.id) : false}
        onClose={() => setContextMenu(null)}
        onAddToPlaylist={(song) => {
          setContextMenu(null);
          setAddToPlaylistSong(song);
        }}
        onToggleLike={(song) => toggleLike(song)}
      />

      <AddToPlaylistModal
        isOpen={!!addToPlaylistSong}
        song={addToPlaylistSong}
        onClose={() => setAddToPlaylistSong(null)}
      />
    </div>
  );
}
