import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePlayerStore } from "@/stores/playerStore";
import type { Song } from "@/types";

// Mock heavy child components so this test focuses on PlayerBar itself.
vi.mock("@/components/player/AudioEngine", () => ({
  default: () => null,
}));
vi.mock("@/components/player/SeekBar", () => ({
  default: () => <div data-testid="seek-bar" />,
}));
vi.mock("@/components/player/VolumeControl", () => ({
  default: () => <div data-testid="volume-control" />,
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Mock useLikedSongs so we don't hit Dexie in jsdom.
const toggleLikeMock = vi.fn();
const likedIds = new Set<string>();
vi.mock("@/hooks/usePlaylist", () => ({
  useLikedSongs: () => ({
    likedSongs: [],
    likedIds,
    isLiked: (id: string) => likedIds.has(id),
    toggleLike: toggleLikeMock,
    refresh: vi.fn(),
  }),
  usePlaylists: () => ({
    playlists: [],
    loading: false,
    refresh: vi.fn(),
    createPlaylist: vi.fn(),
    renamePlaylist: vi.fn(),
    deletePlaylist: vi.fn(),
    addSongToPlaylist: vi.fn(),
    removeSongFromPlaylist: vi.fn(),
  }),
}));

// Mock AddToPlaylistModal — we only check that it mounts when opened.
vi.mock("@/components/playlist/AddToPlaylistModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog" aria-label="Add to Playlist" /> : null,
}));

// Mock toast so success/error calls don't break.
vi.mock("@/stores/toastStore", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import PlayerBar from "@/components/player/PlayerBar";

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

describe("PlayerBar — feedback #4 (like + add-to-playlist)", () => {
  beforeEach(() => {
    toggleLikeMock.mockClear();
    likedIds.clear();
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

  it("renders nothing when no current song", () => {
    const { container } = render(<PlayerBar />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Heart and + buttons when a song is playing", () => {
    const song = makeSong("1");
    act(() => {
      usePlayerStore.getState().playSong(song);
    });
    render(<PlayerBar />);

    expect(screen.getByRole("button", { name: /add to liked songs/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to playlist/i })).toBeInTheDocument();
  });

  it("clicking Heart calls toggleLike with the current song", async () => {
    const user = userEvent.setup();
    const song = makeSong("abc");
    act(() => {
      usePlayerStore.getState().playSong(song);
    });
    render(<PlayerBar />);

    await user.click(screen.getByRole("button", { name: /add to liked songs/i }));
    expect(toggleLikeMock).toHaveBeenCalledTimes(1);
    expect(toggleLikeMock).toHaveBeenCalledWith(expect.objectContaining({ id: "abc" }));
  });

  it("clicking + opens the AddToPlaylist modal", async () => {
    const user = userEvent.setup();
    const song = makeSong("1");
    act(() => {
      usePlayerStore.getState().playSong(song);
    });
    render(<PlayerBar />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add to playlist/i }));
    expect(screen.getByRole("dialog", { name: /add to playlist/i })).toBeInTheDocument();
  });

  it("Heart button reflects liked state via aria-pressed", () => {
    const song = makeSong("liked-id");
    likedIds.add("liked-id");
    act(() => {
      usePlayerStore.getState().playSong(song);
    });
    render(<PlayerBar />);

    const heart = screen.getByRole("button", { name: /remove from liked songs/i });
    expect(heart).toHaveAttribute("aria-pressed", "true");
  });
});
