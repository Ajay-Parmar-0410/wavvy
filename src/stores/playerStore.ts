import { create } from "zustand";
import type { Song, RepeatMode } from "@/types";

interface PlayerState {
  // Playback
  currentSong: Song | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;

  // Queue
  queue: Song[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  shuffledIndices: number[];

  // UI
  isExpandedPlayer: boolean;
  isQueueOpen: boolean;
}

interface PlayerActions {
  // Playback controls
  playSong: (song: Song, queue?: Song[], index?: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // Queue controls
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (song: Song) => void;
  addToQueueNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // Mode toggles
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  // UI toggles
  toggleExpandedPlayer: () => void;
  setExpandedPlayer: (open: boolean) => void;
  toggleQueue: () => void;
  setQueueOpen: (open: boolean) => void;
}

function generateShuffledIndices(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i).filter(
    (i) => i !== currentIndex
  );
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return [currentIndex, ...indices];
}

function getNextIndex(state: PlayerState): number | null {
  const { queue, queueIndex, shuffle, repeat, shuffledIndices } = state;
  if (queue.length === 0) return null;

  if (repeat === "one") return queueIndex;

  if (shuffle) {
    const currentShufflePos = shuffledIndices.indexOf(queueIndex);
    const nextShufflePos = currentShufflePos + 1;
    if (nextShufflePos < shuffledIndices.length) {
      return shuffledIndices[nextShufflePos];
    }
    return repeat === "all" ? shuffledIndices[0] : null;
  }

  const nextIndex = queueIndex + 1;
  if (nextIndex < queue.length) return nextIndex;
  return repeat === "all" ? 0 : null;
}

function getPreviousIndex(state: PlayerState): number | null {
  const { queue, queueIndex, shuffle, repeat, shuffledIndices } = state;
  if (queue.length === 0) return null;

  if (shuffle) {
    const currentShufflePos = shuffledIndices.indexOf(queueIndex);
    const prevShufflePos = currentShufflePos - 1;
    if (prevShufflePos >= 0) {
      return shuffledIndices[prevShufflePos];
    }
    return repeat === "all" ? shuffledIndices[shuffledIndices.length - 1] : null;
  }

  const prevIndex = queueIndex - 1;
  if (prevIndex >= 0) return prevIndex;
  return repeat === "all" ? queue.length - 1 : null;
}

const INITIAL_VOLUME = 0.7;

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  // Initial state
  currentSong: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  volume: INITIAL_VOLUME,
  isMuted: false,
  queue: [],
  queueIndex: -1,
  shuffle: false,
  repeat: "off",
  shuffledIndices: [],
  isExpandedPlayer: false,
  isQueueOpen: false,

  // Playback controls
  playSong: (song, queue, index) => {
    const newQueue = queue ?? [song];
    const newIndex = index ?? (queue ? queue.findIndex((s) => s.id === song.id) : 0);
    const state = get();

    set({
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      queue: newQueue,
      queueIndex: newIndex >= 0 ? newIndex : 0,
      shuffledIndices: state.shuffle
        ? generateShuffledIndices(newQueue.length, newIndex >= 0 ? newIndex : 0)
        : [],
    });
  },

  togglePlay: () => {
    const state = get();
    if (!state.currentSong) return;
    set({ isPlaying: !state.isPlaying });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (time) => set({ currentTime: time }),

  setVolume: (volume) => {
    set({ volume, isMuted: volume === 0 });
  },

  toggleMute: () => {
    const state = get();
    set({ isMuted: !state.isMuted });
  },

  // Queue controls
  playNext: () => {
    const state = get();
    const nextIndex = getNextIndex(state);
    if (nextIndex === null) {
      set({ isPlaying: false });
      return;
    }
    set({
      currentSong: state.queue[nextIndex],
      queueIndex: nextIndex,
      isPlaying: true,
      currentTime: 0,
    });
  },

  playPrevious: () => {
    const state = get();

    // If more than 3 seconds in, restart current song
    if (state.currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    const prevIndex = getPreviousIndex(state);
    if (prevIndex === null) {
      set({ currentTime: 0 });
      return;
    }
    set({
      currentSong: state.queue[prevIndex],
      queueIndex: prevIndex,
      isPlaying: true,
      currentTime: 0,
    });
  },

  addToQueue: (song) => {
    const state = get();
    const newQueue = [...state.queue, song];
    set({
      queue: newQueue,
      shuffledIndices: state.shuffle
        ? generateShuffledIndices(newQueue.length, state.queueIndex)
        : [],
    });
  },

  addToQueueNext: (song) => {
    const state = get();
    const insertAt = state.queueIndex + 1;
    const newQueue = [
      ...state.queue.slice(0, insertAt),
      song,
      ...state.queue.slice(insertAt),
    ];
    set({
      queue: newQueue,
      shuffledIndices: state.shuffle
        ? generateShuffledIndices(newQueue.length, state.queueIndex)
        : [],
    });
  },

  removeFromQueue: (index) => {
    const state = get();
    const newQueue = state.queue.filter((_, i) => i !== index);
    let newIndex = state.queueIndex;
    if (index < state.queueIndex) newIndex--;
    if (index === state.queueIndex) {
      // If removing the currently playing song
      if (newQueue.length === 0) {
        set({
          queue: [],
          queueIndex: -1,
          currentSong: null,
          isPlaying: false,
        });
        return;
      }
      newIndex = Math.min(newIndex, newQueue.length - 1);
      set({
        queue: newQueue,
        queueIndex: newIndex,
        currentSong: newQueue[newIndex],
      });
      return;
    }
    set({
      queue: newQueue,
      queueIndex: newIndex,
      shuffledIndices: state.shuffle
        ? generateShuffledIndices(newQueue.length, newIndex)
        : [],
    });
  },

  clearQueue: () => {
    const state = get();
    if (!state.currentSong) {
      set({ queue: [], queueIndex: -1, shuffledIndices: [] });
      return;
    }
    set({
      queue: [state.currentSong],
      queueIndex: 0,
      shuffledIndices: [],
    });
  },

  reorderQueue: (fromIndex, toIndex) => {
    const state = get();
    const newQueue = [...state.queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);

    let newIndex = state.queueIndex;
    if (fromIndex === state.queueIndex) {
      newIndex = toIndex;
    } else {
      if (fromIndex < state.queueIndex && toIndex >= state.queueIndex) newIndex--;
      if (fromIndex > state.queueIndex && toIndex <= state.queueIndex) newIndex++;
    }

    set({
      queue: newQueue,
      queueIndex: newIndex,
      shuffledIndices: state.shuffle
        ? generateShuffledIndices(newQueue.length, newIndex)
        : [],
    });
  },

  // Mode toggles
  toggleShuffle: () => {
    const state = get();
    const newShuffle = !state.shuffle;
    set({
      shuffle: newShuffle,
      shuffledIndices: newShuffle
        ? generateShuffledIndices(state.queue.length, state.queueIndex)
        : [],
    });
  },

  cycleRepeat: () => {
    const state = get();
    const modes: RepeatMode[] = ["off", "all", "one"];
    const currentModeIndex = modes.indexOf(state.repeat);
    set({ repeat: modes[(currentModeIndex + 1) % modes.length] });
  },

  // UI toggles
  toggleExpandedPlayer: () => {
    set((state) => ({ isExpandedPlayer: !state.isExpandedPlayer }));
  },
  setExpandedPlayer: (open) => set({ isExpandedPlayer: open }),
  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
  setQueueOpen: (open) => set({ isQueueOpen: open }),
}));
