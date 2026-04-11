"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import type { Playlist, Song } from "@/types";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.playlists.orderBy("updatedAt").reverse().toArray();
    setPlaylists(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPlaylist = useCallback(
    async (name: string, description?: string): Promise<Playlist> => {
      const playlist: Playlist = {
        id: generateId(),
        name,
        description,
        songs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.playlists.add(playlist);
      await refresh();
      return playlist;
    },
    [refresh]
  );

  const renamePlaylist = useCallback(
    async (id: string, name: string) => {
      await db.playlists.update(id, { name, updatedAt: Date.now() });
      await refresh();
    },
    [refresh]
  );

  const deletePlaylist = useCallback(
    async (id: string) => {
      const playlist = await db.playlists.get(id);
      if (playlist?.isDefault) return;
      await db.playlists.delete(id);
      await refresh();
    },
    [refresh]
  );

  const addSongToPlaylist = useCallback(
    async (playlistId: string, song: Song) => {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) return;
      const exists = playlist.songs.some((s) => s.id === song.id);
      if (exists) return;
      const updatedSongs = [...playlist.songs, song];
      await db.playlists.update(playlistId, {
        songs: updatedSongs,
        updatedAt: Date.now(),
      });
      await refresh();
    },
    [refresh]
  );

  const removeSongFromPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) return;
      const updatedSongs = playlist.songs.filter((s) => s.id !== songId);
      await db.playlists.update(playlistId, {
        songs: updatedSongs,
        updatedAt: Date.now(),
      });
      await refresh();
    },
    [refresh]
  );

  return {
    playlists,
    loading,
    refresh,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
  };
}

export function useLikedSongs() {
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const liked = await db.playlists.get("liked-songs");
    if (liked) {
      setLikedSongs(liked.songs);
      setLikedIds(new Set(liked.songs.map((s) => s.id)));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleLike = useCallback(
    async (song: Song) => {
      const liked = await db.playlists.get("liked-songs");
      if (!liked) return;

      const isLiked = liked.songs.some((s) => s.id === song.id);
      const updatedSongs = isLiked
        ? liked.songs.filter((s) => s.id !== song.id)
        : [...liked.songs, song];

      await db.playlists.update("liked-songs", {
        songs: updatedSongs,
        updatedAt: Date.now(),
      });
      await refresh();
    },
    [refresh]
  );

  const isLiked = useCallback(
    (songId: string) => likedIds.has(songId),
    [likedIds]
  );

  return { likedSongs, likedIds, isLiked, toggleLike, refresh };
}
