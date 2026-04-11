"use client";

import { useRef, useState, useCallback } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { formatTime, cn } from "@/lib/utils";

interface SeekBarProps {
  className?: string;
  showTime?: boolean;
  thin?: boolean;
}

export default function SeekBar({ className, showTime = true, thin = false }: SeekBarProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);

  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getPercentFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!barRef.current) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      return (x / rect.width) * 100;
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      const percent = getPercentFromEvent(e);
      setCurrentTime((percent / 100) * duration);

      const handleMouseMove = (e: MouseEvent) => {
        const p = getPercentFromEvent(e);
        setCurrentTime((p / 100) * duration);
      };
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [duration, getPercentFromEvent, setCurrentTime]
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showTime && (
        <span className="text-[11px] font-mono text-text-muted w-10 text-right select-none">
          {formatTime(currentTime)}
        </span>
      )}

      <div
        ref={barRef}
        className={cn(
          "relative flex-1 group cursor-pointer",
          thin ? "h-1" : "h-1.5"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => setHoverPercent(getPercentFromEvent(e))}
        onMouseLeave={() => setHoverPercent(null)}
      >
        {/* Track */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-border transition-[height]",
            "group-hover:h-2 group-hover:-top-0.5",
            thin ? "h-1" : "h-1.5"
          )}
        />

        {/* Fill */}
        <div
          className={cn(
            "absolute left-0 top-0 rounded-full bg-accent-primary transition-[height]",
            "group-hover:h-2 group-hover:-top-0.5",
            thin ? "h-1" : "h-1.5"
          )}
          style={{ width: `${progressPercent}%` }}
        />

        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-text-primary shadow-md transition-opacity",
            isDragging || hoverPercent !== null ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          style={{ left: `${progressPercent}%` }}
        />

        {/* Hover time tooltip */}
        {hoverPercent !== null && duration > 0 && (
          <div
            className="absolute -top-8 -translate-x-1/2 px-1.5 py-0.5 rounded bg-bg-tertiary text-[10px] font-mono text-text-primary pointer-events-none"
            style={{ left: `${hoverPercent}%` }}
          >
            {formatTime((hoverPercent / 100) * duration)}
          </div>
        )}
      </div>

      {showTime && (
        <span className="text-[11px] font-mono text-text-muted w-10 select-none">
          {formatTime(duration)}
        </span>
      )}
    </div>
  );
}
