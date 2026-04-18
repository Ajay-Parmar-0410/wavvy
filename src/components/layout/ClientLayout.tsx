"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import PlayerBar from "@/components/player/PlayerBar";
import ExpandedPlayer from "@/components/player/ExpandedPlayer";
import QueuePanel from "@/components/player/QueuePanel";
import ToastContainer from "@/components/ui/Toast";
import { usePlayerStore } from "@/stores/playerStore";
import { ensureDefaultPlaylist } from "@/lib/db";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentSong = usePlayerStore((s) => s.currentSong);

  useKeyboardShortcuts();

  useEffect(() => {
    ensureDefaultPlaylist();
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // swallow registration failures
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: currentSong
              ? "calc(var(--player-height) + var(--mobile-nav-height))"
              : "var(--mobile-nav-height)",
          }}
        >
          {children}
        </div>
      </main>

      {/* Player bar — shown when a song is active */}
      {currentSong && <PlayerBar />}

      {/* Expanded player overlay */}
      <ExpandedPlayer />

      {/* Queue slide-out panel */}
      <QueuePanel />

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
