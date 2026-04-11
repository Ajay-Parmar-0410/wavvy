"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/playerStore";

const VOLUME_STEP = 0.05;

export default function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const store = usePlayerStore.getState();

      switch (e.key) {
        case " ":
          e.preventDefault();
          store.togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            store.playNext();
          } else {
            // Seek forward 5s
            const newTime = Math.min(store.currentTime + 5, store.duration);
            store.setCurrentTime(newTime);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) {
            store.playPrevious();
          } else {
            // Seek backward 5s
            const backTime = Math.max(store.currentTime - 5, 0);
            store.setCurrentTime(backTime);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          store.setVolume(Math.min(store.volume + VOLUME_STEP, 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          store.setVolume(Math.max(store.volume - VOLUME_STEP, 0));
          break;
        case "m":
        case "M":
          store.toggleMute();
          break;
        case "s":
        case "S":
          if (!e.ctrlKey && !e.metaKey) {
            store.toggleShuffle();
          }
          break;
        case "r":
        case "R":
          if (!e.ctrlKey && !e.metaKey) {
            store.cycleRepeat();
          }
          break;
        case "q":
        case "Q":
          store.toggleQueue();
          break;
        case "Escape":
          if (store.isExpandedPlayer) {
            store.setExpandedPlayer(false);
          } else if (store.isQueueOpen) {
            store.setQueueOpen(false);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
