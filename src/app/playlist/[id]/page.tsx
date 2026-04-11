"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play, Shuffle, Heart, Music, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { usePlayerStore } from "@/stores/playerStore";
import { useLikedSongs } from "@/hooks/usePlaylist";
import SongRow from "@/components/song/SongRow";
import SongContextMenu from "@/components/song/SongContextMenu";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import type { Playlist, Song } from "@/types";

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const playSong = usePlayerStore((s) => s.playSong);
  const { isLiked, toggleLike } = useLikedSongs();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    song: Song;
    position: { x: number; y: number };
  } | null>(null);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);

  const loadPlaylist = useCallback(async () => {
    // Check local IndexedDB first
    const local = await db.playlists.get(params.id);
    if (local) {
      setPlaylist(local);
      setLoading(false);
      return;
    }

    // Otherwise try fetching from JioSaavn API
    try {
      const res = await fetch(`/api/saavn/playlist/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setPlaylist({
          id: json.data.id,
          name: json.data.name,
          description: json.data.description,
          songs: json.data.songs,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (!playlist || playlist.songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * playlist.songs.length);
    playSong(playlist.songs[randomIndex], playlist.songs, randomIndex);
    usePlayerStore.getState().toggleShuffle();
  };

  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;
    const updatedSongs = playlist.songs.filter((s) => s.id !== songId);
    await db.playlists.update(playlist.id, {
      songs: updatedSongs,
      updatedAt: Date.now(),
    });
    setPlaylist({ ...playlist, songs: updatedSongs, updatedAt: Date.now() });
  };

  const handleContextMenu = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ song, position: { x: e.clientX, y: e.clientY } });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-48 bg-bg-tertiary rounded-xl mb-6" />
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

  if (!playlist) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20">
        <p className="text-text-muted">Playlist not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-accent-primary text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  const coverImage = playlist.songs[0]?.imageHq || playlist.songs[0]?.image;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Cover */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden bg-bg-secondary flex-shrink-0 mx-auto md:mx-0 shadow-xl">
          {playlist.isDefault ? (
            <div className="w-full h-full bg-gradient-to-br from-accent-secondary to-accent-primary flex items-center justify-center">
              <Heart className="w-20 h-20 text-white fill-white" />
            </div>
          ) : coverImage ? (
            <Image
              src={coverImage}
              alt={playlist.name}
              fill
              className="object-cover"
              sizes="224px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-20 h-20 text-text-muted" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-end text-center md:text-left">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
            Playlist
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-sm text-text-secondary mb-2">
              {playlist.description}
            </p>
          )}
          <p className="text-sm text-text-muted">
            {playlist.songs.length} song{playlist.songs.length !== 1 ? "s" : ""}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4 justify-center md:justify-start">
            <button
              onClick={handlePlayAll}
              disabled={playlist.songs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-primary text-bg-primary font-medium text-sm hover:brightness-110 disabled:opacity-50 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Play
            </button>
            <button
              onClick={handleShufflePlay}
              disabled={playlist.songs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-bg-tertiary text-text-primary font-medium text-sm hover:bg-border disabled:opacity-50 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Songs */}
      {playlist.songs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Music className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-secondary text-sm">
            This playlist is empty. Add songs to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {playlist.songs.map((song, i) => (
            <div key={song.id} className="group relative flex items-center">
              <div className="flex-1">
                <SongRow
                  song={song}
                  index={i}
                  showIndex
                  queue={playlist.songs}
                  onContextMenu={handleContextMenu}
                />
              </div>
              {/* Remove button for local playlists */}
              <button
                onClick={() => handleRemoveSong(song.id)}
                className="p-1.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all mr-2"
                aria-label="Remove from playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
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

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={!!addToPlaylistSong}
        song={addToPlaylistSong}
        onClose={() => setAddToPlaylistSong(null)}
      />
    </div>
  );
}

