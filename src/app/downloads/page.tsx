"use client";

import { useState } from "react";
import { Download, Trash2, Play, Shuffle, WifiOff } from "lucide-react";
import { useDownloads } from "@/hooks/useDownload";
import { usePlayerStore } from "@/stores/playerStore";
import { toast } from "@/stores/toastStore";
import SongRow from "@/components/song/SongRow";
import type { Song } from "@/types";

export default function DownloadsPage() {
  const { downloads, loading, removeDownload, clearAllDownloads } = useDownloads();
  const playSong = usePlayerStore((s) => s.playSong);
  const [confirmClear, setConfirmClear] = useState(false);

  const songs: Song[] = downloads.map((d) => d.song);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * songs.length);
    playSong(songs[randomIndex], songs, randomIndex);
    usePlayerStore.getState().toggleShuffle();
  };

  const handleRemove = async (songId: string) => {
    await removeDownload(songId);
    toast.success("Removed from offline library");
  };

  const handleClearAll = async () => {
    await clearAllDownloads();
    setConfirmClear(false);
    toast.success("All downloads cleared");
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const totalSize = downloads.reduce((acc, d) => acc + (d.size || 0), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-bg-tertiary rounded mb-6" />
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary flex items-center gap-2">
            <WifiOff className="w-6 h-6" />
            Offline Library
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {downloads.length} song{downloads.length !== 1 ? "s" : ""}
            {totalSize > 0 && ` · ${formatSize(totalSize)}`}
          </p>
        </div>

        {downloads.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Clear all?</span>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-full bg-danger text-white text-xs font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 rounded-full bg-bg-tertiary text-text-secondary text-xs font-medium"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="p-2 text-text-muted hover:text-danger transition-colors"
                aria-label="Clear all downloads"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {downloads.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-primary text-bg-primary font-medium text-sm hover:brightness-110 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Play All
          </button>
          <button
            onClick={handleShufflePlay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-bg-tertiary text-text-primary font-medium text-sm hover:bg-border transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
        </div>
      )}

      {/* Song list */}
      {downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-2">
            No downloads yet
          </h2>
          <p className="text-text-secondary text-sm max-w-sm">
            Save songs for offline listening by tapping the download button on any
            song.
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {downloads.map((dl, i) => (
            <div key={dl.id} className="group relative flex items-center">
              <div className="flex-1">
                <SongRow song={dl.song} index={i} showIndex queue={songs} />
              </div>
              <div className="flex items-center gap-2 mr-2">
                {dl.size && (
                  <span className="text-[10px] text-text-muted font-mono">
                    {formatSize(dl.size)}
                  </span>
                )}
                <button
                  onClick={() => handleRemove(dl.id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all"
                  aria-label="Remove download"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
