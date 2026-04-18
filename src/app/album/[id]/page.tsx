"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play, Shuffle, Disc3, Calendar } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useLikedSongs } from "@/hooks/usePlaylist";
import SongRow from "@/components/song/SongRow";
import SongContextMenu from "@/components/song/SongContextMenu";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import type { Album, Song } from "@/types";

export default function AlbumPage({ params }: { params: { id: string } }) {
  const playSong = usePlayerStore((s) => s.playSong);
  const { isLiked, toggleLike } = useLikedSongs();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    song: Song;
    position: { x: number; y: number };
  } | null>(null);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);

  const loadAlbum = useCallback(async () => {
    try {
      const res = await fetch(`/api/saavn/album/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setAlbum(json.data);
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  const handlePlayAll = () => {
    if (album && album.songs.length > 0) {
      playSong(album.songs[0], album.songs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (!album || album.songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * album.songs.length);
    playSong(album.songs[randomIndex], album.songs, randomIndex);
    usePlayerStore.getState().toggleShuffle();
  };

  const handleContextMenu = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ song, position: { x: e.clientX, y: e.clientY } });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="w-48 h-48 md:w-56 md:h-56 bg-bg-tertiary rounded-xl mx-auto md:mx-0" />
            <div className="flex-1 space-y-3 flex flex-col justify-end">
              <div className="h-4 w-20 bg-bg-tertiary rounded" />
              <div className="h-8 w-3/4 bg-bg-tertiary rounded" />
              <div className="h-4 w-1/2 bg-bg-tertiary rounded" />
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

  if (!album) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20">
        <Disc3 className="w-12 h-12 text-text-muted mb-3" />
        <p className="text-text-muted">Album not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden bg-bg-secondary flex-shrink-0 mx-auto md:mx-0 shadow-xl">
          {album.imageHq ? (
            <Image
              src={album.imageHq}
              alt={album.name}
              fill
              className="object-cover"
              sizes="224px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 className="w-20 h-20 text-text-muted" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end text-center md:text-left">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
            Album
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
            {album.name}
          </h1>
          <p className="text-sm text-text-secondary">{album.artist}</p>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-1 justify-center md:justify-start">
            {album.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {album.year}
              </span>
            )}
            <span>
              {album.songs.length} song{album.songs.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-4 justify-center md:justify-start">
            <button
              onClick={handlePlayAll}
              disabled={album.songs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-primary text-bg-primary font-medium text-sm hover:brightness-110 disabled:opacity-50 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Play
            </button>
            <button
              onClick={handleShufflePlay}
              disabled={album.songs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-bg-tertiary text-text-primary font-medium text-sm hover:bg-border disabled:opacity-50 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Songs */}
      <div className="space-y-0.5">
        {album.songs.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            index={i}
            showIndex
            queue={album.songs}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

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
