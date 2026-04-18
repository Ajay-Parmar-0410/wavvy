import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "@/stores/playerStore";
import type { Song } from "@/types";

const makeSong = (id: string, title = `Song ${id}`): Song => ({
  id,
  title,
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

describe("playerStore", () => {
  beforeEach(() => {
    // Reset store to initial state
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

  describe("playSong", () => {
    it("sets current song and starts playing", () => {
      const song = makeSong("1");
      usePlayerStore.getState().playSong(song);

      const state = usePlayerStore.getState();
      expect(state.currentSong).toEqual(song);
      expect(state.isPlaying).toBe(true);
      expect(state.currentTime).toBe(0);
    });

    it("sets queue when provided", () => {
      const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[1], songs, 1);

      const state = usePlayerStore.getState();
      expect(state.queue).toEqual(songs);
      expect(state.queueIndex).toBe(1);
      expect(state.currentSong?.id).toBe("2");
    });

    it("creates single-song queue when no queue provided", () => {
      const song = makeSong("1");
      usePlayerStore.getState().playSong(song);

      expect(usePlayerStore.getState().queue).toEqual([song]);
      expect(usePlayerStore.getState().queueIndex).toBe(0);
    });
  });

  describe("togglePlay", () => {
    it("does nothing without a current song", () => {
      usePlayerStore.getState().togglePlay();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it("toggles playing state", () => {
      usePlayerStore.getState().playSong(makeSong("1"));
      expect(usePlayerStore.getState().isPlaying).toBe(true);

      usePlayerStore.getState().togglePlay();
      expect(usePlayerStore.getState().isPlaying).toBe(false);

      usePlayerStore.getState().togglePlay();
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });
  });

  describe("playNext", () => {
    it("advances to next song in queue", () => {
      const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[0], songs, 0);

      usePlayerStore.getState().playNext();
      expect(usePlayerStore.getState().currentSong?.id).toBe("2");
      expect(usePlayerStore.getState().queueIndex).toBe(1);
    });

    it("stops at end of queue with repeat off", () => {
      const songs = [makeSong("1"), makeSong("2")];
      usePlayerStore.getState().playSong(songs[1], songs, 1);

      usePlayerStore.getState().playNext();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it("loops back with repeat all", () => {
      const songs = [makeSong("1"), makeSong("2")];
      usePlayerStore.getState().playSong(songs[1], songs, 1);
      usePlayerStore.setState({ repeat: "all" });

      usePlayerStore.getState().playNext();
      expect(usePlayerStore.getState().currentSong?.id).toBe("1");
      expect(usePlayerStore.getState().queueIndex).toBe(0);
    });

    it("replays same song with repeat one", () => {
      const songs = [makeSong("1"), makeSong("2")];
      usePlayerStore.getState().playSong(songs[0], songs, 0);
      usePlayerStore.setState({ repeat: "one" });

      usePlayerStore.getState().playNext();
      expect(usePlayerStore.getState().currentSong?.id).toBe("1");
    });
  });

  describe("playPrevious", () => {
    it("goes to previous song", () => {
      const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[2], songs, 2);

      usePlayerStore.getState().playPrevious();
      expect(usePlayerStore.getState().currentSong?.id).toBe("2");
    });

    it("restarts song if past 3 seconds", () => {
      const songs = [makeSong("1"), makeSong("2")];
      usePlayerStore.getState().playSong(songs[1], songs, 1);
      usePlayerStore.setState({ currentTime: 10 });

      usePlayerStore.getState().playPrevious();
      // Should restart current song, not go back
      expect(usePlayerStore.getState().currentSong?.id).toBe("2");
      expect(usePlayerStore.getState().currentTime).toBe(0);
    });
  });

  describe("queue operations", () => {
    it("addToQueue appends a song", () => {
      usePlayerStore.getState().playSong(makeSong("1"));
      usePlayerStore.getState().addToQueue(makeSong("2"));

      expect(usePlayerStore.getState().queue).toHaveLength(2);
      expect(usePlayerStore.getState().queue[1].id).toBe("2");
    });

    it("addToQueueNext inserts after current", () => {
      const songs = [makeSong("1"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[0], songs, 0);
      usePlayerStore.getState().addToQueueNext(makeSong("2"));

      expect(usePlayerStore.getState().queue[1].id).toBe("2");
      expect(usePlayerStore.getState().queue[2].id).toBe("3");
    });

    it("removeFromQueue removes and adjusts index", () => {
      const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[1], songs, 1);

      usePlayerStore.getState().removeFromQueue(0);
      expect(usePlayerStore.getState().queue).toHaveLength(2);
      expect(usePlayerStore.getState().queueIndex).toBe(0); // shifted
    });

    it("clearQueue keeps only current song", () => {
      const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[0], songs, 0);

      usePlayerStore.getState().clearQueue();
      expect(usePlayerStore.getState().queue).toHaveLength(1);
      expect(usePlayerStore.getState().queue[0].id).toBe("1");
    });

    it("reorderQueue moves a song", () => {
      const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[0], songs, 0);

      usePlayerStore.getState().reorderQueue(2, 0);
      expect(usePlayerStore.getState().queue[0].id).toBe("3");
      expect(usePlayerStore.getState().queue[1].id).toBe("1");
      expect(usePlayerStore.getState().queue[2].id).toBe("2");
    });
  });

  describe("shuffle", () => {
    it("toggleShuffle generates shuffled indices", () => {
      const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[0], songs, 0);

      usePlayerStore.getState().toggleShuffle();
      const state = usePlayerStore.getState();
      expect(state.shuffle).toBe(true);
      expect(state.shuffledIndices).toHaveLength(3);
      // First element should be current index
      expect(state.shuffledIndices[0]).toBe(0);
    });

    it("toggleShuffle off clears indices", () => {
      const songs = [makeSong("1"), makeSong("2"), makeSong("3")];
      usePlayerStore.getState().playSong(songs[0], songs, 0);

      usePlayerStore.getState().toggleShuffle(); // on
      usePlayerStore.getState().toggleShuffle(); // off
      expect(usePlayerStore.getState().shuffle).toBe(false);
      expect(usePlayerStore.getState().shuffledIndices).toEqual([]);
    });
  });

  describe("repeat", () => {
    it("cycles through repeat modes", () => {
      expect(usePlayerStore.getState().repeat).toBe("off");

      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe("all");

      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe("one");

      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeat).toBe("off");
    });
  });

  describe("volume", () => {
    it("setVolume updates volume", () => {
      usePlayerStore.getState().setVolume(0.5);
      expect(usePlayerStore.getState().volume).toBe(0.5);
    });

    it("setVolume to 0 mutes", () => {
      usePlayerStore.getState().setVolume(0);
      expect(usePlayerStore.getState().isMuted).toBe(true);
    });

    it("toggleMute toggles mute state", () => {
      expect(usePlayerStore.getState().isMuted).toBe(false);
      usePlayerStore.getState().toggleMute();
      expect(usePlayerStore.getState().isMuted).toBe(true);
      usePlayerStore.getState().toggleMute();
      expect(usePlayerStore.getState().isMuted).toBe(false);
    });
  });

  describe("UI toggles", () => {
    it("toggleExpandedPlayer toggles state", () => {
      expect(usePlayerStore.getState().isExpandedPlayer).toBe(false);
      usePlayerStore.getState().toggleExpandedPlayer();
      expect(usePlayerStore.getState().isExpandedPlayer).toBe(true);
    });

    it("setExpandedPlayer sets state directly", () => {
      usePlayerStore.getState().setExpandedPlayer(true);
      expect(usePlayerStore.getState().isExpandedPlayer).toBe(true);
      usePlayerStore.getState().setExpandedPlayer(false);
      expect(usePlayerStore.getState().isExpandedPlayer).toBe(false);
    });

    it("toggleQueue toggles state", () => {
      expect(usePlayerStore.getState().isQueueOpen).toBe(false);
      usePlayerStore.getState().toggleQueue();
      expect(usePlayerStore.getState().isQueueOpen).toBe(true);
    });
  });
});
