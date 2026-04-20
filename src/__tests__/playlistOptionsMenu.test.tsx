import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlaylistOptionsMenu from "@/components/playlist/PlaylistOptionsMenu";
import DeletePlaylistDialog from "@/components/playlist/DeletePlaylistDialog";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ children, ...rest }: any) =>
          <div {...rest}>{children}</div>,
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const anchorRect = {
  top: 100,
  left: 100,
  right: 140,
  bottom: 140,
  width: 40,
  height: 40,
  x: 100,
  y: 100,
  toJSON: () => ({}),
} as DOMRect;

describe("PlaylistOptionsMenu", () => {
  it("renders Edit details and Delete entries and fires handlers", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <PlaylistOptionsMenu
        isOpen
        anchorRect={anchorRect}
        onClose={onClose}
        onEditDetails={onEdit}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("menuitem", { name: /edit details/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not render when closed", () => {
    render(
      <PlaylistOptionsMenu
        isOpen={false}
        anchorRect={anchorRect}
        onClose={vi.fn()}
        onEditDetails={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("DeletePlaylistDialog", () => {
  it("shows playlist name in confirmation copy", () => {
    render(
      <DeletePlaylistDialog
        isOpen
        playlistName="My Playlist #11"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/My Playlist #11/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /delete from your library/i })
    ).toBeInTheDocument();
  });

  it("calls onConfirm when Delete pressed", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DeletePlaylistDialog
        isOpen
        playlistName="Random"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel pressed", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DeletePlaylistDialog
        isOpen
        playlistName="Random"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
