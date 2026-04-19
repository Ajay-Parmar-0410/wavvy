"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Music, Check } from "lucide-react";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { enrichSong } from "@/lib/enrichSong";
import type { Playlist, Song } from "@/types";

interface AddToPlaylistModalProps {
  isOpen: boolean;
  song: Song | null;
  onClose: () => void;
}

export default function AddToPlaylistModal({
  isOpen,
  song,
  onClose,
}: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      db.playlists.toArray().then(setPlaylists);
      setAddedTo(new Set());
      setCreating(false);
      setNewName("");
    }
  }, [isOpen]);

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!song) return;
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return;

    const exists = playlist.songs.some((s) => s.id === song.id);
    if (exists) return;

    const fullSong = await enrichSong(song);
    await db.playlists.update(playlistId, {
      songs: [...playlist.songs, fullSong],
      updatedAt: Date.now(),
    });
    setAddedTo((prev) => { const next = new Set(prev); next.add(playlistId); return next; });
  };

  const handleCreateAndAdd = async () => {
    if (!song || !newName.trim()) return;
    const fullSong = await enrichSong(song);
    const playlist: Playlist = {
      id: generateId(),
      name: newName.trim(),
      songs: [fullSong],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.playlists.add(playlist);
    setPlaylists((prev) => [playlist, ...prev]);
    setAddedTo((prev) => { const next = new Set(prev); next.add(playlist.id); return next; });
    setCreating(false);
    setNewName("");
  };

  if (!song) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[71] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-bg-secondary rounded-xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-heading text-base font-semibold text-text-primary">
                Add to Playlist
              </h3>
              <button
                onClick={onClose}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Song info */}
            <div className="px-4 py-2 border-b border-border/50">
              <p className="text-sm text-text-primary truncate">{song.title}</p>
              <p className="text-xs text-text-secondary truncate">{song.artist}</p>
            </div>

            {/* Playlist list */}
            <div className="max-h-64 overflow-y-auto">
              {/* Create new */}
              {creating ? (
                <div className="flex items-center gap-2 px-4 py-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Playlist name"
                    className="flex-1 px-3 py-1.5 rounded bg-bg-tertiary text-sm text-text-primary placeholder:text-text-muted outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateAndAdd();
                      if (e.key === "Escape") setCreating(false);
                    }}
                  />
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={!newName.trim()}
                    className="px-3 py-1.5 rounded bg-accent-primary text-bg-primary text-xs font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-bg-tertiary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-bg-tertiary flex items-center justify-center">
                    <Plus className="w-4 h-4 text-text-secondary" />
                  </div>
                  <span className="text-sm text-text-primary font-medium">
                    New Playlist
                  </span>
                </button>
              )}

              {/* Existing playlists */}
              {playlists.map((playlist) => {
                const alreadyIn =
                  addedTo.has(playlist.id) ||
                  playlist.songs.some((s) => s.id === song.id);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => !alreadyIn && handleAddToPlaylist(playlist.id)}
                    disabled={alreadyIn}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-bg-tertiary/50 transition-colors disabled:opacity-60"
                  >
                    <div className="w-8 h-8 rounded bg-bg-tertiary flex items-center justify-center">
                      <Music className="w-4 h-4 text-text-muted" />
                    </div>
                    <span className="flex-1 text-sm text-text-primary truncate">
                      {playlist.name}
                    </span>
                    {alreadyIn && (
                      <Check className="w-4 h-4 text-accent-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
