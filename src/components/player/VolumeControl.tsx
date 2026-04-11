"use client";

import { useRef, useState, useCallback } from "react";
import { Volume2, Volume1, VolumeX } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";

export default function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayVolume = isMuted ? 0 : volume;

  const getVolumeFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return x / rect.width;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setVolume(getVolumeFromEvent(e));

      const handleMouseMove = (e: MouseEvent) => {
        setVolume(getVolumeFromEvent(e));
      };
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [getVolumeFromEvent, setVolume]
  );

  const VolumeIcon = displayVolume === 0 ? VolumeX : displayVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className="p-1 text-text-muted hover:text-text-primary transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        <VolumeIcon className="w-4 h-4" />
      </button>

      <div
        ref={barRef}
        className="relative w-20 h-1 group cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        {/* Track */}
        <div className="absolute inset-0 rounded-full bg-border group-hover:h-1.5 group-hover:-top-0.5 h-1 transition-[height]" />

        {/* Fill */}
        <div
          className="absolute left-0 top-0 rounded-full bg-text-primary group-hover:bg-accent-primary group-hover:h-1.5 group-hover:-top-0.5 h-1 transition-[height,background-color]"
          style={{ width: `${displayVolume * 100}%` }}
        />

        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-text-primary shadow-md transition-opacity",
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          style={{ left: `${displayVolume * 100}%` }}
        />
      </div>
    </div>
  );
}
