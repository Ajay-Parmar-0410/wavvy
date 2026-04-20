import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Stub Dexie interactions.
const playlistsGet = vi.fn();
const playlistsUpdate = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    playlists: {
      get: (...args: unknown[]) => playlistsGet(...args),
      update: (...args: unknown[]) => playlistsUpdate(...args),
    },
  },
}));

vi.mock("@/lib/enrichSong", () => ({
  enrichSong: async (s: unknown) => s,
}));

const toastSuccess = vi.fn();
const toastInfo = vi.fn();
const toastError = vi.fn();
vi.mock("@/stores/toastStore", () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    info: (m: string) => toastInfo(m),
    error: (m: string) => toastError(m),
  },
}));

import PlaylistSongSearch from "@/components/playlist/PlaylistSongSearch";

const searchPayload = {
  success: true,
  data: {
    songs: [
      {
        id: "s1",
        title: "Ramta Jogi",
        artist: "Sukhwinder Singh",
        album: "Taal",
        duration: 300,
        image: "/r.jpg",
        imageHq: "/r-hq.jpg",
        hasLyrics: true,
        source: "saavn",
        sourceId: "s1",
      },
    ],
  },
};

describe("PlaylistSongSearch", () => {
  beforeEach(() => {
    playlistsGet.mockReset();
    playlistsUpdate.mockReset();
    toastSuccess.mockReset();
    toastInfo.mockReset();
    toastError.mockReset();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ json: async () => searchPayload })
    );
  });

  it("renders the Spotify-style heading", () => {
    render(
      <PlaylistSongSearch
        playlistId="p1"
        existingSongIds={new Set()}
        onSongAdded={vi.fn()}
      />
    );
    expect(
      screen.getByRole("heading", { name: /let.s find something/i })
    ).toBeInTheDocument();
  });

  it("searches and shows results, then adds song via Add button", async () => {
    const user = userEvent.setup();
    const onSongAdded = vi.fn();
    playlistsGet.mockResolvedValue({
      id: "p1",
      name: "My Playlist #11",
      songs: [],
      createdAt: 0,
      updatedAt: 0,
    });
    playlistsUpdate.mockResolvedValue(undefined);

    render(
      <PlaylistSongSearch
        playlistId="p1"
        existingSongIds={new Set()}
        onSongAdded={onSongAdded}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/search for songs/i),
      "ramta"
    );

    await waitFor(() => screen.getByText("Ramta Jogi"));

    await user.click(
      screen.getByRole("button", { name: /add "Ramta Jogi"/i })
    );

    await waitFor(() => expect(onSongAdded).toHaveBeenCalledTimes(1));
    expect(playlistsUpdate).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        songs: expect.arrayContaining([expect.objectContaining({ id: "s1" })]),
      })
    );
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("Ramta Jogi"));
  });

  it("marks a song Added when already in the playlist", async () => {
    const user = userEvent.setup();
    render(
      <PlaylistSongSearch
        playlistId="p1"
        existingSongIds={new Set(["s1"])}
        onSongAdded={vi.fn()}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/search for songs/i),
      "ramta"
    );
    await waitFor(() => screen.getByText("Ramta Jogi"));

    const btn = screen.getByRole("button", { name: /already added/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/added/i);
  });
});
