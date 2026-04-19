import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePlayerStore } from "@/stores/playerStore";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, prefetch: vi.fn() }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Mock AddToPlaylistModal — just render a dialog when open so we can assert it.
vi.mock("@/components/playlist/AddToPlaylistModal", () => ({
  default: ({ isOpen, song }: { isOpen: boolean; song: { title: string } | null }) =>
    isOpen && song ? (
      <div role="dialog" aria-label="Add to Playlist">
        <span data-testid="modal-song-title">{song.title}</span>
      </div>
    ) : null,
}));

import SearchBar from "@/components/layout/SearchBar";

const mockSuggestionsPayload = {
  success: true,
  data: {
    songs: [
      {
        id: "song-1",
        title: "Kalank Title Track",
        artist: "Arijit Singh",
        album: "Kalank",
        duration: 300,
        image: "/k.jpg",
        imageHq: "/k-hq.jpg",
        streamUrl: "https://example.com/k.mp3",
        hasLyrics: true,
        source: "saavn",
        sourceId: "song-1",
      },
      {
        id: "song-2",
        title: "First Class",
        artist: "Arijit Singh",
        album: "Kalank",
        duration: 280,
        image: "/f.jpg",
        imageHq: "/f-hq.jpg",
        hasLyrics: true,
        source: "saavn",
        sourceId: "song-2",
      },
    ],
    albums: [],
    artists: [],
  },
};

describe("SearchBar — feedback #1 (+ button in dropdown)", () => {
  beforeEach(() => {
    pushMock.mockClear();
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => mockSuggestionsPayload,
      })
    );
  });

  it("renders a + button next to each song suggestion", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search songs/i);
    await user.type(input, "kalank");

    await waitFor(() => {
      expect(screen.getByText("Kalank Title Track")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /add "Kalank Title Track" to playlist/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add "First Class" to playlist/i })
    ).toBeInTheDocument();
  });

  it("clicking + opens the AddToPlaylist modal with that song, WITHOUT playing it", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search songs/i);
    await user.type(input, "kalank");
    await waitFor(() => screen.getByText("Kalank Title Track"));

    const plus = screen.getByRole("button", {
      name: /add "Kalank Title Track" to playlist/i,
    });
    await user.click(plus);

    // Modal opens with correct song
    expect(screen.getByRole("dialog", { name: /add to playlist/i })).toBeInTheDocument();
    expect(screen.getByTestId("modal-song-title")).toHaveTextContent("Kalank Title Track");

    // Crucially — playback was NOT triggered (row click is separate)
    expect(usePlayerStore.getState().currentSong).toBeNull();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it("clicking the row body still plays the song (regression guard)", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search songs/i);
    await user.type(input, "kalank");
    await waitFor(() => screen.getByText("Kalank Title Track"));

    await user.click(screen.getByText("Kalank Title Track"));

    expect(usePlayerStore.getState().currentSong?.id).toBe("song-1");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it("Shift+Enter on a focused suggestion opens the modal without playing", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search songs/i);
    await user.type(input, "kalank");
    await waitFor(() => screen.getByText("Kalank Title Track"));

    // Find the row (role=button div) for the first song
    const row = screen.getByText("Kalank Title Track").closest('[role="button"]');
    expect(row).toBeTruthy();
    row!.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    (row as HTMLElement).focus();

    await user.keyboard("{Shift>}{Enter}{/Shift}");

    expect(screen.getByRole("dialog", { name: /add to playlist/i })).toBeInTheDocument();
    expect(usePlayerStore.getState().currentSong).toBeNull();
  });
});
