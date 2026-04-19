"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Library,
  Plus,
  Search,
  ArrowDownUp,
  Heart,
  Music,
  Clock,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaylists } from "@/hooks/usePlaylist";
import { useMobileUiStore } from "@/stores/mobileUiStore";

const FILTER_CHIPS = ["Playlists", "Artists", "Albums"] as const;
type Filter = (typeof FILTER_CHIPS)[number];

export default function LibrarySidebar() {
  const pathname = usePathname();
  const { playlists } = usePlaylists();
  const openCreateSheet = useMobileUiStore((s) => s.openCreateSheet);
  const [activeFilter, setActiveFilter] = useState<Filter | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlaylists = useMemo(() => {
    if (!searchTerm.trim()) return playlists;
    const q = searchTerm.trim().toLowerCase();
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, searchTerm]);

  return (
    <>
      <aside
        className="hidden md:flex flex-col bg-bg-secondary rounded-card overflow-hidden"
        style={{ width: "var(--tw-sidebar, 320px)", minWidth: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button
            type="button"
            className="flex items-center gap-3 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Your Library"
          >
            <Library className="w-6 h-6" />
            <span className="font-semibold text-sm">Your Library</span>
          </button>
          <button
            type="button"
            onClick={openCreateSheet}
            aria-label="Create playlist"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {activeFilter && (
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              className="px-2 py-1 rounded-full bg-bg-hover text-text-primary text-xs flex-shrink-0"
              aria-label="Clear filter"
            >
              ✕
            </button>
          )}
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveFilter((cur) => (cur === chip ? null : chip))}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                activeFilter === chip
                  ? "bg-text-primary text-bg-primary"
                  : "bg-bg-tertiary text-text-primary hover:bg-bg-hover"
              )}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Shortcut rows — History / Downloads */}
        <div className="px-2 pb-2">
          <Link
            href="/history"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname.startsWith("/history")
                ? "bg-bg-hover text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            )}
          >
            <Clock className="w-4 h-4" />
            Recently Played
          </Link>
          <Link
            href="/downloads"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname.startsWith("/downloads")
                ? "bg-bg-hover text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            )}
          >
            <Download className="w-4 h-4" />
            Downloads
          </Link>
        </div>

        {/* Search + sort */}
        <div className="flex items-center justify-between px-4 pb-2">
          {searchOpen ? (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => {
                if (!searchTerm) setSearchOpen(false);
              }}
              autoFocus
              placeholder="Search in Your Library"
              className="flex-1 bg-bg-tertiary rounded-md px-2 py-1 text-xs text-text-primary placeholder:text-text-muted outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search in Your Library"
              className="p-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="Sort"
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Recents
            <ArrowDownUp className="w-3 h-3" />
          </button>
        </div>

        {/* Playlist list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {filteredPlaylists.length === 0 && (
            <div className="px-4 py-6 text-xs text-text-muted">
              {searchTerm
                ? "No matches"
                : "Create your first playlist with the + button."}
            </div>
          )}
          {filteredPlaylists.map((playlist) => {
            const isActive = pathname === `/playlist/${playlist.id}`;
            return (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-bg-hover text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded flex items-center justify-center flex-shrink-0",
                    playlist.isDefault
                      ? "bg-gradient-to-br from-accent-secondary to-accent-primary"
                      : "bg-bg-tertiary"
                  )}
                >
                  {playlist.isDefault ? (
                    <Heart className="w-4 h-4 text-white fill-white" />
                  ) : (
                    <Music className="w-4 h-4 text-text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-text-primary text-sm">
                    {playlist.name}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {playlist.isDefault ? "Playlist · Pinned" : "Playlist"}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
