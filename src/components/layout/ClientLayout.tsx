"use client";

import { useEffect } from "react";
import TopBar from "./TopBar";
import LibrarySidebar from "./LibrarySidebar";
import RightPanel from "./RightPanel";
import MobileNav from "./MobileNav";
import MobileTopBar from "./MobileTopBar";
import ProfileDrawer from "./ProfileDrawer";
import CreateSheet from "./CreateSheet";
import PlayerBar from "@/components/player/PlayerBar";
import ExpandedPlayer from "@/components/player/ExpandedPlayer";
import QueuePanel from "@/components/player/QueuePanel";
import ToastContainer from "@/components/ui/Toast";
import { usePlayerStore } from "@/stores/playerStore";
import { useMobileUiStore } from "@/stores/mobileUiStore";
import { ensureDefaultPlaylist } from "@/lib/db";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const profileDrawerOpen = useMobileUiStore((s) => s.profileDrawerOpen);
  const closeProfileDrawer = useMobileUiStore((s) => s.closeProfileDrawer);
  const createSheetOpen = useMobileUiStore((s) => s.createSheetOpen);
  const closeCreateSheet = useMobileUiStore((s) => s.closeCreateSheet);

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

  const bottomPad = currentSong
    ? "calc(var(--player-height) + var(--mobile-nav-height))"
    : "var(--mobile-nav-height)";

  return (
    <div className="h-screen flex flex-col bg-bg-root overflow-hidden">
      {/* Desktop top bar (plan2 §3.1) */}
      <TopBar />

      {/* Mobile top bar (keeps search reachable on small screens) */}
      <MobileTopBar />

      {/* Three-column shell (desktop) / single-column (mobile) */}
      <div
        className="flex-1 flex md:gap-2 md:px-2 md:pb-2 overflow-hidden"
        style={{
          paddingBottom: currentSong ? "var(--player-height)" : undefined,
        }}
      >
        <LibrarySidebar />

        <main className="flex-1 flex flex-col md:rounded-card bg-bg-secondary overflow-hidden">
          <div
            className="flex-1 overflow-y-auto"
            style={{ paddingBottom: bottomPad }}
          >
            {children}
          </div>
        </main>

        <RightPanel />
      </div>

      {/* Player bar */}
      {currentSong && <PlayerBar />}

      {/* Overlays */}
      <ExpandedPlayer />
      <QueuePanel />

      {/* Mobile nav */}
      <MobileNav />

      {/* Mobile overlays */}
      <ProfileDrawer
        isOpen={profileDrawerOpen}
        onClose={closeProfileDrawer}
      />
      <CreateSheet isOpen={createSheetOpen} onClose={closeCreateSheet} />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
