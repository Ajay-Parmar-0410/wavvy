"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, User } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useLikedSongs } from "@/hooks/usePlaylist";
import SongRow from "@/components/song/SongRow";
import SongContextMenu from "@/components/song/SongContextMenu";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import type { Artist, Album, Song } from "@/types";

export default function ArtistPage({ params }: { params: { id: string } }) {
  const playSong = usePlayerStore((s) => s.playSong);
  const { isLiked, toggleLike } = useLikedSongs();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [singles, setSingles] = useState<Album[]>([]);
  const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="flex flex-col items-center mb-8">
            <div className="w-40 h-40 rounded-full bg-bg-tertiary mb-4" />
            <div className="h-8 w-48 bg-bg-tertiary rounded mb-2" />
            <div className="h-4 w-32 bg-bg-tertiary rounded" />
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
      {/* Artist header */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-40 h-40 rounded-full overflow-hidden bg-bg-secondary shadow-xl mb-4">
          {artist.imageHq ? (
            <Image
              src={artist.imageHq}
              alt={artist.name}
              fill
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-text-muted" />
            </div>
          )}
        </div>
        <h1 className="font-heading text-3xl font-bold text-text-primary mb-1">
          {artist.name}
        </h1>
        {artist.bio && (
          <p className="text-sm text-text-secondary text-center max-w-lg mt-2">
            {artist.bio}
          </p>
        )}

        {topSongs.length > 0 && (
          <button
            onClick={() => playSong(topSongs[0], topSongs, 0)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent-primary text-bg-primary font-medium text-sm hover:brightness-110 transition-all mt-4"
          >
            <Play className="w-4 h-4 fill-current" />
            Play Top Songs
          </button>
        )}
      </div>

      {/* Top Songs */}
      {topSongs.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-4">
            Popular Songs
          </h2>
          <div className="space-y-0.5">
            {topSongs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                showIndex
                queue={topSongs}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </section>
      )}

      {/* Top Albums */}
      {topAlbums.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-4">
            Albums
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topAlbums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="group p-3 rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary mb-3">
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
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                </div>
                <p className="text-sm font-medium text-text-primary truncate">
                  {album.name}
                </p>
                {album.year && (
                  <p className="text-xs text-text-muted mt-0.5">{album.year}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Singles */}
      {singles.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-4">
            Singles
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {singles.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="group p-3 rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary mb-3">
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
                </div>
                <p className="text-sm font-medium text-text-primary truncate">
                  {album.name}
                </p>
                {album.year && (
                  <p className="text-xs text-text-muted mt-0.5">{album.year}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Similar Artists */}
      {similarArtists.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-4">
            Fans Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similarArtists.map((a) => (
              <Link
                key={a.id}
                href={`/artist/${a.id}`}
                className="group p-3 rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors text-center"
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

      {/* Context Menu */}
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
