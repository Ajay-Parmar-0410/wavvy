"use client";

import Image from "next/image";
import { Play, Pause, Shuffle, CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artist } from "@/types";

interface ArtistMobileHeroProps {
  artist: Artist;
  monthlyListeners?: string;
  isPlaying: boolean;
  onPlay: () => void;
  onShuffle?: () => void;
  disabled?: boolean;
}

export default function ArtistMobileHero({
  artist,
  monthlyListeners,
  isPlaying,
  onPlay,
  onShuffle,
  disabled,
}: ArtistMobileHeroProps) {
  const coverUrl = artist.imageHq || artist.image;

  return (
    <div className="md:hidden -mx-4 -mt-4 mb-4">
      <div className="relative w-full aspect-[4/5] overflow-hidden">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={artist.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
            <User className="w-20 h-20 text-text-muted" />
          </div>
        )}

        {/* Gradient + text overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-secondary" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-text-primary">
            <CheckCircle2
              className="w-4 h-4 text-[#4CB3FF] fill-[#4CB3FF]"
              aria-hidden
            />
            <span className="font-medium">Verified Artist</span>
          </div>
          <h1 className="font-heading text-4xl font-black text-text-primary leading-none break-words">
            {artist.name}
          </h1>
          {monthlyListeners && (
            <p className="text-xs text-text-secondary mt-1">
              {monthlyListeners} monthly listeners
            </p>
          )}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3 px-4 mt-4">
        <button
          type="button"
          className="px-4 py-1.5 rounded-full border border-border text-xs font-semibold text-text-primary hover:border-text-primary transition-colors"
        >
          Follow
        </button>
        {onShuffle && (
          <button
            type="button"
            onClick={onShuffle}
            disabled={disabled}
            aria-label="Shuffle"
            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors ml-auto"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onPlay}
          disabled={disabled}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={cn(
            "w-14 h-14 rounded-full bg-accent-primary text-bg-primary flex items-center justify-center hover:bg-accent-hover disabled:opacity-50 transition-all shadow-lg",
            !onShuffle && "ml-auto"
          )}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
