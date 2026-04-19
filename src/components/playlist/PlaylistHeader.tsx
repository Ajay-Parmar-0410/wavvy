"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Play, Pause, Shuffle, MoreHorizontal, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDominantColor } from "@/lib/colors";

interface PlaylistHeaderProps {
  kind: "Playlist" | "Album" | "Artist";
  title: string;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode; // "15 songs · 51 min"
  coverUrl?: string;
  coverFallbackClassName?: string; // used for default Liked gradient
  coverFallback?: React.ReactNode;
  isPlaying?: boolean;
  onPlay?: () => void;
  onShuffle?: () => void;
  disabled?: boolean;
  secondaryActions?: React.ReactNode;
  circular?: boolean; // artist-style cover
}

export default function PlaylistHeader({
  kind,
  title,
  subtitle,
  meta,
  coverUrl,
  coverFallbackClassName,
  coverFallback,
  isPlaying,
  onPlay,
  onShuffle,
  disabled,
  secondaryActions,
  circular,
}: PlaylistHeaderProps) {
  const [dominant, setDominant] = useState<string>("rgb(40, 40, 40)");

  useEffect(() => {
    let cancelled = false;
    if (!coverUrl) {
      setDominant("rgb(40, 40, 40)");
      return;
    }
    getDominantColor(coverUrl).then((color) => {
      if (!cancelled) setDominant(color);
    });
    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  const gradient = useMemo(
    () =>
      `linear-gradient(to bottom, ${dominant} 0%, ${dominant} 20%, #121212 100%)`,
    [dominant]
  );

  return (
    <div
      className="relative -mx-6 -mt-6 px-6 pt-10 pb-6"
      style={{ background: gradient }}
    >
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
        <div
          className={cn(
            "relative w-48 h-48 md:w-56 md:h-56 overflow-hidden bg-bg-secondary flex-shrink-0 shadow-2xl",
            circular ? "rounded-full" : "rounded-md",
            coverFallbackClassName
          )}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="224px"
              priority
            />
          ) : (
            coverFallback
          )}
        </div>

        <div className="flex flex-col justify-end text-center md:text-left">
          <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
            {kind}
          </p>
          <h1 className="font-heading text-4xl md:text-6xl font-black text-text-primary mb-3 leading-none break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-text-secondary mb-1">{subtitle}</p>
          )}
          {meta && <p className="text-sm text-text-muted">{meta}</p>}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={onPlay}
          disabled={disabled}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="w-14 h-14 rounded-full bg-accent-primary text-bg-primary flex items-center justify-center hover:bg-accent-hover hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>
        {onShuffle && (
          <button
            onClick={onShuffle}
            disabled={disabled}
            aria-label="Shuffle"
            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        )}
        {secondaryActions}
        <button
          aria-label="More"
          className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// Re-exported so callers can keep the existing default-Liked gradient look.
export function LikedCoverFallback() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-accent-secondary to-accent-primary flex items-center justify-center">
      <Heart className="w-20 h-20 text-white fill-white" />
    </div>
  );
}
