"use client";

import Image from "next/image";
import { Play, Pause, MoreHorizontal } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { formatTime, cn } from "@/lib/utils";
import type { Song } from "@/types";

interface SongRowProps {
  song: Song;
  index?: number;
  showIndex?: boolean;
  queue?: Song[];
  onContextMenu?: (song: Song, e: React.MouseEvent) => void;
}

export default function SongRow({ song, index, showIndex, queue, onContextMenu }: SongRowProps) {
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
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
        isCurrentSong ? "bg-bg-tertiary" : "hover:bg-bg-tertiary/50"
      )}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu?.(song, e)}
    >
      {/* Index / Play indicator */}
      <div className="w-6 flex items-center justify-center flex-shrink-0">
        {isCurrentlyPlaying ? (
          <Pause className="w-4 h-4 text-accent-primary fill-current" />
        ) : (
          <span className="group-hover:hidden text-sm text-text-muted font-mono">
            {showIndex && index !== undefined ? index + 1 : ""}
          </span>
        )}
        {!isCurrentlyPlaying && (
          <Play className="w-4 h-4 text-text-primary hidden group-hover:block fill-current" />
        )}
      </div>

      {/* Thumbnail */}
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
        {/* Source badge */}
        {song.source === "youtube" && (
          <span className="absolute bottom-0 right-0 bg-red-600 text-white text-[7px] font-bold px-0.5 leading-tight rounded-tl">
            YT
          </span>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0">
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

      {/* Album (desktop) */}
      <div className="hidden lg:block flex-1 min-w-0">
        <p className="text-xs text-text-secondary truncate">{song.album}</p>
      </div>

      {/* Duration */}
      <span className="text-xs text-text-muted font-mono w-12 text-right flex-shrink-0">
        {formatTime(song.duration)}
      </span>

      {/* More button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu?.(song, e);
        }}
        className="p-1 opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-opacity"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}
