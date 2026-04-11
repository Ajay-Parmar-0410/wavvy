"use client";

import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";

interface SongCardProps {
  song: Song;
  queue?: Song[];
  index?: number;
}

export default function SongCard({ song, queue, index }: SongCardProps) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playSong = usePlayerStore((s) => s.playSong);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  const handleClick = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song, queue, index);
    }
  };

  return (
    <div
      className="group relative flex flex-col gap-2 p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors cursor-pointer"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-bg-tertiary">
        {song.image && (
          <Image
            src={song.image}
            alt={song.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />
        )}

        {/* Play button overlay */}
        <div
          className={cn(
            "absolute bottom-2 right-2 w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-lg transition-all",
            isCurrentlyPlaying
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          )}
        >
          {isCurrentlyPlaying ? (
            <Pause className="w-5 h-5 text-bg-primary fill-current" />
          ) : (
            <Play className="w-5 h-5 text-bg-primary fill-current ml-0.5" />
          )}
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isCurrentSong ? "text-accent-primary" : "text-text-primary"
          )}
        >
          {song.title}
        </p>
        <p className="text-xs text-text-secondary truncate">{song.artist}</p>
      </div>
    </div>
  );
}
