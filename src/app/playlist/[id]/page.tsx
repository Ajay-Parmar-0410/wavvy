"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Music, Trash2, GripVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { enrichSong } from "@/lib/enrichSong";
import { toast } from "@/stores/toastStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useLikedSongs } from "@/hooks/usePlaylist";
import SongRow from "@/components/song/SongRow";
import SongContextMenu from "@/components/song/SongContextMenu";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import PlaylistHeader, {
  LikedCoverFallback,
} from "@/components/playlist/PlaylistHeader";
import RecommendedForPlaylist from "@/components/playlist/RecommendedForPlaylist";
import PlaylistSongSearch from "@/components/playlist/PlaylistSongSearch";
import PlaylistOptionsMenu from "@/components/playlist/PlaylistOptionsMenu";
import DeletePlaylistDialog from "@/components/playlist/DeletePlaylistDialog";
import EditPlaylistDetailsModal from "@/components/playlist/EditPlaylistDetailsModal";
import type { Playlist, Song } from "@/types";

function formatTotalTime(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours} hr ${remMins} min`;
}

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { isLiked, toggleLike } = useLikedSongs();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    song: Song;
    position: { x: number; y: number };
  } | null>(null);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);

  const [optionsAnchor, setOptionsAnchor] = useState<DOMRect | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Track the latest persisted order so concurrent drags don't regress state.
  const latestSongsRef = useRef<Song[]>([]);

  const loadPlaylist = useCallback(async () => {
    const local = await db.playlists.get(params.id);
    if (local) {
      setPlaylist(local);
      latestSongsRef.current = local.songs;
      setLoading(false);

      const stale = local.songs.filter(
        (s) =>
          (!s.duration || s.duration <= 0 || !s.streamUrl) &&
          s.source === "saavn"
      );
      if (stale.length > 0) {
        Promise.all(local.songs.map((s) => enrichSong(s))).then(
          async (enriched) => {
            const changed = enriched.some(
              (s, i) =>
                s.duration !== local.songs[i].duration ||
                s.streamUrl !== local.songs[i].streamUrl
            );
            if (!changed) return;
            await db.playlists.update(params.id, {
              songs: enriched,
              updatedAt: Date.now(),
            });
            latestSongsRef.current = enriched;
            setPlaylist((cur) =>
              cur ? { ...cur, songs: enriched } : cur
            );
          }
        );
      }
      return;
    }

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

  const isCurrentPlaylistPlaying =
    playlist?.songs.some((s) => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!playlist || playlist.songs.length === 0) return;
    if (isCurrentPlaylistPlaying) {
      usePlayerStore.getState().togglePlay();
      return;
    }
    playSong(playlist.songs[0], playlist.songs, 0);
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
    latestSongsRef.current = updatedSongs;
    setPlaylist({ ...playlist, songs: updatedSongs, updatedAt: Date.now() });
  };

  const handleContextMenu = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ song, position: { x: e.clientX, y: e.clientY } });
  };

  const handleSongAdded = (song: Song) => {
    setPlaylist((p) =>
      p
        ? {
            ...p,
            songs: [...p.songs, song],
            updatedAt: Date.now(),
          }
        : p
    );
    latestSongsRef.current = [...latestSongsRef.current, song];
  };

  const handleDelete = async () => {
    if (!playlist || playlist.isDefault) return;
    try {
      await db.playlists.delete(playlist.id);
      toast.success(`Removed "${playlist.name}"`);
      router.replace("/library");
    } catch {
      toast.error("Couldn't delete playlist");
    }
  };

  const handleSaveDetails = async (data: {
    name: string;
    description: string;
  }) => {
    if (!playlist) return;
    try {
      await db.playlists.update(playlist.id, {
        name: data.name,
        description: data.description || undefined,
        updatedAt: Date.now(),
      });
      setPlaylist({
        ...playlist,
        name: data.name,
        description: data.description || undefined,
        updatedAt: Date.now(),
      });
      toast.success("Playlist updated");
    } catch {
      toast.error("Couldn't update playlist");
    }
  };

  const reorderSongs = async (fromId: string, toId: string) => {
    if (!playlist) return;
    if (fromId === toId) return;
    const songs = latestSongsRef.current;
    const fromIdx = songs.findIndex((s) => s.id === fromId);
    const toIdx = songs.findIndex((s) => s.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...songs];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    latestSongsRef.current = next;
    setPlaylist({ ...playlist, songs: next, updatedAt: Date.now() });
    try {
      await db.playlists.update(playlist.id, {
        songs: next,
        updatedAt: Date.now(),
      });
    } catch {
      toast.error("Couldn't save new order");
    }
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
  const totalDuration = playlist.songs.reduce(
    (sum, s) => sum + (s.duration || 0),
    0
  );
  const songWord = playlist.songs.length === 1 ? "song" : "songs";
  const meta =
    playlist.songs.length > 0
      ? `${playlist.songs.length} ${songWord} · ${formatTotalTime(totalDuration)}`
      : `${playlist.songs.length} ${songWord}`;

  const existingIds = new Set(playlist.songs.map((s) => s.id));
  const isUserPlaylist = !playlist.isDefault;
  // Allow search-for-songs on every user playlist (matches Spotify behavior);
  // default 'Liked Songs' playlist doesn't expose add-by-search.
  const canSearchSongs = isUserPlaylist;

  return (
    <div className="p-6">
      <PlaylistHeader
        kind="Playlist"
        title={playlist.name}
        subtitle={playlist.description}
        meta={meta}
        coverUrl={playlist.isDefault ? undefined : coverImage}
        coverFallback={playlist.isDefault ? <LikedCoverFallback /> : null}
        isPlaying={!!isCurrentPlaylistPlaying}
        onPlay={handlePlayAll}
        onShuffle={handleShufflePlay}
        disabled={playlist.songs.length === 0}
        showOptions={isUserPlaylist}
        onOptionsClick={(rect) => setOptionsAnchor(rect)}
        secondaryActions={
          canSearchSongs && playlist.songs.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowSearch((v) => !v)}
              aria-label="Add songs"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-border text-text-primary hover:border-text-primary transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : null
        }
      />

      {/* Always show search panel for empty user playlists; toggleable otherwise. */}
      {canSearchSongs && (showSearch || playlist.songs.length === 0) && (
        <PlaylistSongSearch
          playlistId={playlist.id}
          existingSongIds={existingIds}
          onSongAdded={handleSongAdded}
          onClose={
            playlist.songs.length > 0 ? () => setShowSearch(false) : undefined
          }
        />
      )}

      {/* Songs */}
      {playlist.songs.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Music className="w-10 h-10 text-text-muted mb-3" />
          <p className="text-text-secondary text-sm">
            This playlist is empty. Search above to add songs.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold mt-8">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span className="text-right">Duration</span>
          </div>
          <div className="space-y-0.5 mt-2">
            {playlist.songs.map((song, i) => {
              const isDragging = draggingId === song.id;
              const isDragOver = dragOverId === song.id && draggingId !== song.id;
              return (
                <div
                  key={song.id}
                  draggable={isUserPlaylist}
                  onDragStart={(e) => {
                    if (!isUserPlaylist) return;
                    setDraggingId(song.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", song.id);
                  }}
                  onDragOver={(e) => {
                    if (!isUserPlaylist || !draggingId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverId !== song.id) setDragOverId(song.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverId === song.id) setDragOverId(null);
                  }}
                  onDrop={(e) => {
                    if (!isUserPlaylist) return;
                    e.preventDefault();
                    const fromId =
                      draggingId || e.dataTransfer.getData("text/plain");
                    setDragOverId(null);
                    setDraggingId(null);
                    if (fromId) reorderSongs(fromId, song.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  className={`group relative flex items-center ${
                    isDragging ? "opacity-40" : ""
                  } ${
                    isDragOver ? "ring-1 ring-accent-primary/60 rounded-md" : ""
                  }`}
                >
                  {isUserPlaylist && (
                    <span
                      aria-hidden
                      className="w-5 flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                  )}
                  <div className="flex-1">
                    <SongRow
                      song={song}
                      index={i}
                      showIndex
                      queue={playlist.songs}
                      onContextMenu={handleContextMenu}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all mr-2"
                    aria-label="Remove from playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <RecommendedForPlaylist
            playlistId={playlist.id}
            seedSongs={playlist.songs}
            onSongAdded={handleSongAdded}
          />
        </>
      )}

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

      <PlaylistOptionsMenu
        isOpen={!!optionsAnchor}
        anchorRect={optionsAnchor}
        onClose={() => setOptionsAnchor(null)}
        onEditDetails={() => setShowEdit(true)}
        onDelete={() => setShowDelete(true)}
      />

      <DeletePlaylistDialog
        isOpen={showDelete}
        playlistName={playlist.name}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />

      <EditPlaylistDetailsModal
        isOpen={showEdit}
        initialName={playlist.name}
        initialDescription={playlist.description}
        coverUrl={playlist.isDefault ? undefined : coverImage}
        onClose={() => setShowEdit(false)}
        onSave={handleSaveDetails}
      />
    </div>
  );
}
