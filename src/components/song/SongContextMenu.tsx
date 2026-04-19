"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListPlus,
  ListEnd,
  Heart,
  Download,
  HardDriveDownload,
  Share2,
  Plus,
  Ban,
  Radio,
  User,
  Disc3,
  Clock,
  Info,
  UserPlus,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useDownloadSong } from "@/hooks/useDownload";
import { toast } from "@/stores/toastStore";
import type { Song } from "@/types";

interface SongContextMenuProps {
  song: Song | null;
  position: { x: number; y: number } | null;
  isLiked?: boolean;
  onClose: () => void;
  onAddToPlaylist: (song: Song) => void;
  onToggleLike: (song: Song) => void;
}

type MenuItem =
  | {
      kind: "action";
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      onClick: () => void | Promise<void>;
      stub?: boolean;
    }
  | { kind: "divider" };

export default function SongContextMenu({
  song,
  position,
  isLiked,
  onClose,
  onAddToPlaylist,
  onToggleLike,
}: SongContextMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const addToQueueNext = usePlayerStore((s) => s.addToQueueNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const { downloadToDevice, saveOffline } = useDownloadSong();

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

  const menuWidth = 240;
  const menuHeight = 420;
  const x = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const y = Math.min(position.y, window.innerHeight - menuHeight - 10);

  const items: MenuItem[] = [
    {
      kind: "action",
      icon: Plus,
      label: "Add to playlist",
      onClick: () => {
        onAddToPlaylist(song);
        onClose();
      },
    },
    {
      kind: "action",
      icon: Heart,
      label: isLiked ? "Remove from your Liked Songs" : "Save to your Liked Songs",
      onClick: () => {
        onToggleLike(song);
        toast.success(
          isLiked ? "Removed from Liked Songs" : "Added to Liked Songs"
        );
        onClose();
      },
    },
    {
      kind: "action",
      icon: ListPlus,
      label: "Play next",
      onClick: () => {
        addToQueueNext(song);
        toast.info(`"${song.title}" will play next`);
        onClose();
      },
    },
    {
      kind: "action",
      icon: ListEnd,
      label: "Add to queue",
      onClick: () => {
        addToQueue(song);
        toast.info(`Added "${song.title}" to queue`);
        onClose();
      },
    },
    { kind: "divider" },
    {
      kind: "action",
      icon: Ban,
      label: "Exclude from your taste profile",
      onClick: () => {
        toast.info("Taste-profile controls arrive with sign-in");
        onClose();
      },
      stub: true,
    },
    {
      kind: "action",
      icon: UserPlus,
      label: "Start a Jam",
      onClick: () => {
        toast.info("Jam sessions are coming later");
        onClose();
      },
      stub: true,
    },
    {
      kind: "action",
      icon: Clock,
      label: "Sleep timer",
      onClick: () => {
        toast.info("Sleep timer is on the roadmap");
        onClose();
      },
      stub: true,
    },
    {
      kind: "action",
      icon: Radio,
      label: "Go to song radio",
      onClick: () => {
        toast.info("Song radio is on the roadmap");
        onClose();
      },
      stub: true,
    },
    { kind: "divider" },
    {
      kind: "action",
      icon: User,
      label: "Go to artist",
      onClick: () => {
        if (song.artistId) router.push(`/artist/${song.artistId}`);
        else toast.info("Artist link not available for this song");
        onClose();
      },
    },
    {
      kind: "action",
      icon: Disc3,
      label: "Go to album",
      onClick: () => {
        if (song.albumId) router.push(`/album/${song.albumId}`);
        else toast.info("Album link not available for this song");
        onClose();
      },
    },
    {
      kind: "action",
      icon: Info,
      label: "View credits",
      onClick: () => {
        toast.info("Credits view is on the roadmap");
        onClose();
      },
      stub: true,
    },
    { kind: "divider" },
    {
      kind: "action",
      icon: Download,
      label: "Download to device",
      onClick: async () => {
        onClose();
        toast.info(`Downloading "${song.title}"...`);
        const ok = await downloadToDevice(song);
        if (ok) toast.success("Download started");
        else toast.error("Download failed");
      },
    },
    {
      kind: "action",
      icon: HardDriveDownload,
      label: "Save offline",
      onClick: async () => {
        onClose();
        toast.info(`Saving "${song.title}" offline...`);
        const ok = await saveOffline(song);
        if (ok) toast.success("Saved for offline listening");
        else toast.error("Failed to save offline");
      },
    },
    {
      kind: "action",
      icon: Share2,
      label: "Share",
      onClick: () => {
        const url = `${window.location.origin}/song/${song.sourceId}`;
        navigator.clipboard?.writeText(url);
        toast.success("Link copied to clipboard");
        onClose();
      },
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[80] bg-bg-elevated border border-border rounded-lg shadow-2xl py-1 min-w-[240px]"
        style={{ left: x, top: y }}
        role="menu"
      >
        {items.map((item, idx) => {
          if (item.kind === "divider") {
            return <div key={`d-${idx}`} className="my-1 border-t border-border" />;
          }
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              role="menuitem"
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.stub && (
                <span className="ml-auto text-[10px] text-text-muted uppercase tracking-wider">
                  soon
                </span>
              )}
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
