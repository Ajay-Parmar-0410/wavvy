"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, Users, Shuffle, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlaylists } from "@/hooks/usePlaylist";

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateOption {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: () => void;
  disabled?: boolean;
  badge?: string;
}

export default function CreateSheet({ isOpen, onClose }: CreateSheetProps) {
  const router = useRouter();
  const { createPlaylist } = usePlaylists();
  const [creating, setCreating] = useState(false);

  const handleCreatePlaylist = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const playlist = await createPlaylist("My Playlist");
      onClose();
      router.push(`/playlist/${playlist.id}`);
    } finally {
      setCreating(false);
    }
  };

  const options: CreateOption[] = [
    {
      icon: ListMusic,
      title: "Playlist",
      description: "Build a playlist with songs, or just get started",
      action: handleCreatePlaylist,
    },
    {
      icon: Users,
      title: "Collaborative playlist",
      description: "Create a playlist and invite friends",
      action: () => {},
      disabled: true,
      badge: "Soon",
    },
    {
      icon: Shuffle,
      title: "Blend",
      description: "Mix tastes with friends",
      action: () => {},
      disabled: true,
      badge: "Soon",
    },
    {
      icon: Radio,
      title: "Jam",
      description: "Play music together, live",
      action: () => {},
      disabled: true,
      badge: "Soon",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[85] bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[86] bg-bg-secondary rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+12px)]"
            role="dialog"
            aria-label="Create menu"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-text-muted/50" />
            </div>

            <h3 className="font-heading text-base font-semibold text-text-primary px-5 pt-2 pb-3">
              Create
            </h3>

            <ul className="px-2">
              {options.map(
                ({ icon: Icon, title, description, action, disabled, badge }) => (
                  <li key={title}>
                    <button
                      type="button"
                      onClick={action}
                      disabled={disabled || creating}
                      className="flex items-center gap-4 w-full px-3 py-3 rounded-lg hover:bg-bg-tertiary/60 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-text-primary" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">
                            {title}
                          </span>
                          {badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-bg-pressed text-text-secondary">
                              {badge}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-text-secondary truncate">
                          {description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              )}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
