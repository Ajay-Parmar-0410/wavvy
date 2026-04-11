"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, GripVertical, Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { formatTime } from "@/lib/utils";

export default function QueuePanel() {
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen);
  const playSong = usePlayerStore((s) => s.playSong);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const upNext = queue.slice(queueIndex + 1);

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/40"
            onClick={() => setQueueOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[56] w-full max-w-sm bg-bg-secondary border-l border-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-heading text-lg font-semibold text-text-primary">
                Queue
              </h2>
              <div className="flex items-center gap-2">
                {upNext.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-xs text-text-muted hover:text-danger px-2 py-1 rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setQueueOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                  aria-label="Close queue"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Now Playing */}
              {currentSong && (
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Now Playing
                  </p>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary">
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-bg-primary flex-shrink-0">
                      {currentSong.image && (
                        <Image
                          src={currentSong.image}
                          alt={currentSong.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-accent-primary truncate">
                        {currentSong.title}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {currentSong.artist}
                      </p>
                    </div>
                    <button
                      onClick={togglePlay}
                      className="p-1 text-accent-primary"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Up Next */}
              {upNext.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Up Next ({upNext.length})
                  </p>
                  <div className="space-y-0.5">
                    {upNext.map((song, i) => {
                      const actualIndex = queueIndex + 1 + i;
                      return (
                        <div
                          key={`${song.id}-${actualIndex}`}
                          className="group flex items-center gap-2 p-2 rounded-lg hover:bg-bg-tertiary/50 transition-colors"
                        >
                          <GripVertical className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-50 flex-shrink-0 cursor-grab" />

                          <button
                            onClick={() => playSong(song, queue, actualIndex)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className="relative w-9 h-9 rounded overflow-hidden bg-bg-tertiary flex-shrink-0">
                              {song.image && (
                                <Image
                                  src={song.image}
                                  alt={song.title}
                                  fill
                                  className="object-cover"
                                  sizes="36px"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-text-primary truncate">
                                {song.title}
                              </p>
                              <p className="text-xs text-text-secondary truncate">
                                {song.artist}
                              </p>
                            </div>
                          </button>

                          <span className="text-xs text-text-muted font-mono flex-shrink-0">
                            {formatTime(song.duration)}
                          </span>

                          <button
                            onClick={() => removeFromQueue(actualIndex)}
                            className="p-1 opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all"
                            aria-label="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty queue */}
              {upNext.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <p className="text-text-muted text-sm">
                    No songs in queue. Add songs to play next.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
