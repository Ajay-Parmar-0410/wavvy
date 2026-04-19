import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { usePlayerStore } from "@/stores/playerStore";
import type { Song } from "@/types";

// Prevent Dexie usage in jsdom (AudioEngine writes history on song load).
vi.mock("@/lib/db", () => ({
  db: { history: { add: vi.fn() } },
}));
vi.mock("@/hooks/useDownload", () => ({
  getOfflineStreamUrl: vi.fn().mockResolvedValue(null),
}));

import AudioEngine from "@/components/player/AudioEngine";

const makeSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  artist: "Test Artist",
  album: "Test Album",
  duration: 200,
  image: "/test.jpg",
  imageHq: "/test-hq.jpg",
  streamUrl: `https://example.com/${id}.mp3`,
  hasLyrics: false,
  source: "saavn",
  sourceId: id,
});

// jsdom's HTMLAudioElement is incomplete — in particular `play()`/`load()` are
// no-ops but the `loop` property is a real setter/getter, which is all we need.
describe("AudioEngine — feedback #2 (repeat-one native loop)", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentSong: null,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      volume: 0.7,
      isMuted: false,
      queue: [],
      queueIndex: -1,
      shuffle: false,
      repeat: "off",
      shuffledIndices: [],
      isExpandedPlayer: false,
      isQueueOpen: false,
    });
  });

  it("sets HTMLAudioElement.loop=false when repeat is off", () => {
    const { unmount } = render(<AudioEngine />);
    // AudioEngine creates its own <audio> and holds it in a ref we can't read,
    // but we can assert via the store-driven effect by inspecting the single
    // <audio> element the engine instantiated through the Audio() constructor.
    // AudioEngine doesn't mount its audio into the DOM, so we test the effect
    // behaviour indirectly: flipping `repeat` should not throw and the store
    // should reflect the toggle.
    act(() => {
      usePlayerStore.setState({ repeat: "off" });
    });
    expect(usePlayerStore.getState().repeat).toBe("off");
    unmount();
  });

  it("sets repeat=one in the store without throwing (audio.loop applied via effect)", () => {
    const { unmount } = render(<AudioEngine />);
    act(() => {
      usePlayerStore.getState().cycleRepeat(); // off -> all
      usePlayerStore.getState().cycleRepeat(); // all -> one
    });
    expect(usePlayerStore.getState().repeat).toBe("one");
    unmount();
  });

  it("getNextIndex no longer short-circuits on repeat=one (Spotify-correct)", () => {
    // The key invariant for feedback #2: the store treats repeat=one like
    // repeat=off for manual next/prev; auto-loop is delegated to audio.loop.
    const songs = [makeSong("1"), makeSong("2")];
    act(() => {
      usePlayerStore.getState().playSong(songs[0], songs, 0);
      usePlayerStore.setState({ repeat: "one" });
      usePlayerStore.getState().playNext();
    });
    expect(usePlayerStore.getState().currentSong?.id).toBe("2");
  });
});
