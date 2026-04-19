"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Search, Music, Disc3 } from "lucide-react";
import Link from "next/link";
import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";

export default function RightPanel() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label="Open Now Playing"
        className="hidden xl:flex items-center justify-center w-10 bg-bg-secondary rounded-card text-text-secondary hover:text-text-primary transition-colors"
      >
        <Disc3 className="w-5 h-5" />
      </button>
    );
  }

  const nextUp = queue.slice(queueIndex + 1, queueIndex + 4);

  return (
    <aside
      className="hidden xl:flex flex-col bg-bg-secondary rounded-card overflow-hidden"
      style={{ width: "var(--tw-right-panel, 360px)", minWidth: 320 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-text-primary truncate">
          {currentSong ? currentSong.title : "Now playing"}
        </h2>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Close Now Playing"
          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {currentSong ? (
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary">
            {currentSong.imageHq && (
              <Image
                src={currentSong.imageHq}
                alt={currentSong.title}
                fill
                className="object-cover"
                sizes="360px"
              />
            )}
          </div>
          <div>
            <Link
              href={
                currentSong.artistId
                  ? `/artist/${currentSong.artistId}`
                  : "#"
              }
              className="block"
            >
              <p className="text-lg font-bold text-text-primary truncate hover:underline">
                {currentSong.title}
              </p>
              <p className="text-sm text-text-secondary truncate hover:underline">
                {currentSong.artist}
              </p>
            </Link>
          </div>

          {/* About the artist — stub */}
          <section className="bg-bg-tertiary rounded-lg p-4">
            <p className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">
              About the artist
            </p>
            <p className="text-sm text-text-primary">{currentSong.artist}</p>
          </section>

          {/* Next in queue preview */}
          {nextUp.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-wider text-text-secondary font-semibold">
                  Next in queue
                </h3>
              </div>
              <ul className="space-y-1">
                {nextUp.map((song) => (
                  <li
                    key={song.id}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-md hover:bg-bg-tertiary transition-colors"
                    )}
                  >
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-bg-tertiary flex-shrink-0">
                      {song.image && (
                        <Image
                          src={song.image}
                          alt={song.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">
                        {song.title}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {song.artist}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
            <Music className="w-7 h-7 text-text-secondary" />
          </div>
          <h3 className="font-heading text-lg font-bold text-text-primary mb-1">
            Find something to play
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            Pick a song from Home or search to start listening.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse
          </Link>
        </div>
      )}
    </aside>
  );
}
