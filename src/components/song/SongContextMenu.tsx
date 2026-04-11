"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListPlus,
  ListEnd,
  Heart,
  Download,
  Share2,
  Plus,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import type { Song } from "@/types";

interface SongContextMenuProps {
  song: Song | null;
  position: { x: number; y: number } | null;
  isLiked?: boolean;
  onClose: () => void;
  onAddToPlaylist: (song: Song) => void;
  onToggleLike: (song: Song) => void;
}

export default function SongContextMenu({
  song,
  position,
  isLiked,
  onClose,
  onAddToPlaylist,
  onToggleLike,
}: SongContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const addToQueueNext = usePlayerStore((s) => s.addToQueueNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!song || !position) return null;

  // Adjust position to stay within viewport
  const menuWidth = 200;
  const menuHeight = 250;
  const x = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const y = Math.min(position.y, window.innerHeight - menuHeight - 10);

  const items = [
    {
      icon: ListPlus,
      label: "Play Next",
      onClick: () => {
        addToQueueNext(song);
        onClose();
      },
    },
    {
      icon: ListEnd,
      label: "Add to Queue",
      onClick: () => {
        addToQueue(song);
        onClose();
      },
    },
    {
      icon: Plus,
      label: "Add to Playlist",
      onClick: () => {
        onAddToPlaylist(song);
        onClose();
      },
    },
    {
      icon: Heart,
      label: isLiked ? "Remove from Liked" : "Like",
      onClick: () => {
        onToggleLike(song);
        onClose();
      },
    },
    {
      icon: Download,
      label: "Download",
      onClick: () => {
        if (song.downloadUrl?.["320"]) {
          window.open(song.downloadUrl["320"], "_blank");
        } else if (song.streamUrl) {
          window.open(song.streamUrl, "_blank");
        }
        onClose();
      },
    },
    {
      icon: Share2,
      label: "Share",
      onClick: () => {
        const url = `${window.location.origin}/song/${song.sourceId}`;
        navigator.clipboard?.writeText(url);
        onClose();
      },
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[80] bg-bg-secondary border border-border rounded-lg shadow-xl py-1 min-w-[180px]"
        style={{ left: x, top: y }}
      >
        {items.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors text-left"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
