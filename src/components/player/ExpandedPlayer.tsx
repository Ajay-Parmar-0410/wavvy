"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Download,
  ListMusic,
  Share2,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useLikedSongs } from "@/hooks/usePlaylist";
import { cn } from "@/lib/utils";
import SeekBar from "./SeekBar";

export default function ExpandedPlayer() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const isExpandedPlayer = usePlayerStore((s) => s.isExpandedPlayer);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrevious = usePlayerStore((s) => s.playPrevious);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const setExpandedPlayer = usePlayerStore((s) => s.setExpandedPlayer);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);

  const { isLiked, toggleLike } = useLikedSongs();
  const songIsLiked = currentSong ? isLiked(currentSong.id) : false;

  const [lyrics, setLyrics] = useState<string | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);

  const songId = currentSong?.id;
  const hasLyrics = currentSong?.hasLyrics;
  const sourceId = currentSong?.sourceId;

  // Fetch lyrics when song changes
  useEffect(() => {
    setLyrics(null);
    setShowLyrics(false);
    if (!hasLyrics || !sourceId) return;

    async function fetchLyrics() {
      try {
        const res = await fetch(`/api/saavn/lyrics/${sourceId}`);
        const json = await res.json();
        if (json.success) {
          setLyrics(json.data.lyrics);
        }
      } catch {
        // silently fail
      }
    }
    fetchLyrics();
  }, [songId, hasLyrics, sourceId]);

  if (!currentSong) return null;

  return (
    <AnimatePresence>
      {isExpandedPlayer && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[60] bg-bg-primary flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setExpandedPlayer(false)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Collapse player"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Now Playing
            </span>
            <button
              onClick={() => {
                setExpandedPlayer(false);
                toggleQueue();
              }}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
            {/* Album Art */}
            {!showLyrics ? (
              <motion.div
                key="art"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-[320px] aspect-square rounded-xl overflow-hidden shadow-2xl mb-8"
              >
                {currentSong.imageHq && (
                  <Image
                    src={currentSong.imageHq}
                    alt={currentSong.title}
                    fill
                    className="object-cover"
                    sizes="320px"
                    priority
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 w-full max-w-[320px] overflow-y-auto mb-8 scrollbar-hide"
              >
                {lyrics ? (
                  <div
                    className="text-center text-text-secondary text-base leading-8 whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: lyrics }}
                  />
                ) : (
                  <p className="text-center text-text-muted mt-20">
                    No lyrics available
                  </p>
                )}
              </motion.div>
            )}

            {/* Song Info */}
            <div className="w-full max-w-[320px] mb-6">
              <h2 className="font-heading text-xl font-bold text-text-primary truncate">
                {currentSong.title}
              </h2>
              <p className="text-sm text-text-secondary truncate mt-0.5">
                {currentSong.artist}
              </p>
            </div>

            {/* Seek Bar */}
            <div className="w-full max-w-[320px] mb-6">
              <SeekBar />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={toggleShuffle}
                className={cn(
                  "p-2 transition-colors",
                  shuffle
                    ? "text-accent-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={playPrevious}
                className="p-2 text-text-primary hover:text-accent-primary transition-colors"
                aria-label="Previous"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-text-primary flex items-center justify-center hover:scale-105 transition-transform"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-bg-primary fill-current" />
                ) : (
                  <Play className="w-8 h-8 text-bg-primary fill-current ml-1" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-2 text-text-primary hover:text-accent-primary transition-colors"
                aria-label="Next"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={cycleRepeat}
                className={cn(
                  "p-2 transition-colors",
                  repeat !== "off"
                    ? "text-accent-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label="Repeat"
              >
                {repeat === "one" ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => currentSong && toggleLike(currentSong)}
                className={cn(
                  "p-2 transition-colors",
                  songIsLiked
                    ? "text-accent-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
                aria-label={songIsLiked ? "Unlike" : "Like"}
              >
                <Heart className={cn("w-5 h-5", songIsLiked && "fill-current")} />
              </button>

              <button
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Download"
              >
                <Download className="w-5 h-5" />
              </button>

              {currentSong.hasLyrics && (
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    showLyrics
                      ? "bg-accent-primary text-bg-primary"
                      : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                  )}
                >
                  Lyrics
                </button>
              )}

              <button
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
