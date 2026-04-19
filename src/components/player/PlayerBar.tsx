"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  ChevronUp,
  Heart,
  Plus,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useLikedSongs } from "@/hooks/usePlaylist";
import { toast } from "@/stores/toastStore";
import { cn } from "@/lib/utils";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import AudioEngine from "./AudioEngine";
import SeekBar from "./SeekBar";
import VolumeControl from "./VolumeControl";

export default function PlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleExpandedPlayer = usePlayerStore((s) => s.toggleExpandedPlayer);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);

  const { isLiked, toggleLike } = useLikedSongs();
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);

  if (!currentSong) return null;

  const songIsLiked = isLiked(currentSong.id);

  const handleToggleLike = () => {
    toggleLike(currentSong);
    toast.success(songIsLiked ? "Removed from Liked Songs" : "Added to Liked Songs");
  };

  return (
    <>
      <AudioEngine />
      <div
        className={cn(
          "fixed left-0 right-0 z-50 bg-bg-secondary border-t border-border",
          "md:bottom-0",
          "bottom-[var(--mobile-nav-height)]"
        )}
        style={{ height: "var(--player-height)" }}
      >
        {/* Seek bar at top (mobile only — thin) */}
        <div className="absolute top-0 left-0 right-0 md:hidden">
          <SeekBar thin showTime={false} />
        </div>

        <div className="flex items-center h-full px-4 gap-4">
          {/* Song info (left) */}
          <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none md:w-[340px]">
            <button
              onClick={toggleExpandedPlayer}
              className="flex items-center gap-3 min-w-0 flex-1 text-left"
            >
              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-bg-tertiary flex-shrink-0">
                {currentSong.image && (
                  <Image
                    src={currentSong.image}
                    alt={currentSong.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {currentSong.title}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {currentSong.artist}
                </p>
              </div>
              <ChevronUp className="w-5 h-5 text-text-muted md:hidden flex-shrink-0" />
            </button>

            {/* Like + Add-to-playlist (plan2 §2.4 — fixes feedback #4) */}
            <button
              onClick={handleToggleLike}
              aria-label={songIsLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
              aria-pressed={songIsLiked}
              className={cn(
                "p-1.5 rounded-full transition-colors flex-shrink-0",
                songIsLiked
                  ? "text-accent-primary"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <Heart
                className={cn("w-4 h-4", songIsLiked && "fill-current")}
              />
            </button>
            <button
              onClick={() => setAddToPlaylistOpen(true)}
              aria-label="Add to playlist"
              className="hidden md:block p-1.5 rounded-full text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Controls (center — desktop) */}
          <div className="hidden md:flex flex-col items-center flex-1 gap-1 max-w-[600px]">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShuffle}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  shuffle
                    ? "text-accent-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={playPrevious}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Previous"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-text-primary flex items-center justify-center hover:scale-105 transition-transform"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-bg-primary fill-current" />
                ) : (
                  <Play className="w-5 h-5 text-bg-primary fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Next"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={cycleRepeat}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  repeat !== "off"
                    ? "text-accent-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="Repeat"
              >
                {repeat === "one" ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Seek bar (desktop) */}
            <SeekBar className="w-full" />
          </div>

          {/* Mobile play/pause */}
          <button
            onClick={togglePlay}
            className="md:hidden p-2 text-text-primary"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Volume + Queue (right — desktop only) */}
          <div className="hidden md:flex items-center gap-3 w-[200px] justify-end">
            <button
              onClick={toggleQueue}
              className={cn(
                "p-1.5 transition-colors",
                isQueueOpen
                  ? "text-accent-primary"
                  : "text-text-muted hover:text-text-primary"
              )}
              aria-label="Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <VolumeControl />
          </div>
        </div>
      </div>

      <AddToPlaylistModal
        isOpen={addToPlaylistOpen}
        song={currentSong}
        onClose={() => setAddToPlaylistOpen(false)}
      />
    </>
  );
}
