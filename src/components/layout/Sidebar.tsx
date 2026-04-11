"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  Clock,
  Download,
  Plus,
  Heart,
  Music,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaylists } from "@/hooks/usePlaylist";
import CreatePlaylistModal from "@/components/playlist/CreatePlaylistModal";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/history", label: "History", icon: Clock },
  { href: "/downloads", label: "Downloads", icon: Download },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { playlists, createPlaylist } = usePlaylists();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <aside className="hidden md:flex flex-col w-sidebar h-full bg-bg-secondary border-r border-border">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5">
          <Music2 className="w-7 h-7 text-accent-primary" />
          <span className="font-heading text-xl font-bold text-text-primary tracking-tight">
            Wavvy
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-bg-tertiary text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-6 my-4 border-t border-border" />

        {/* Playlists section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Playlists
            </span>
            <button
              onClick={() => setShowCreate(true)}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              aria-label="Create playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname === `/playlist/${playlist.id}`
                    ? "bg-bg-tertiary text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
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
                <span className="truncate">{playlist.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <CreatePlaylistModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createPlaylist}
      />
    </>
  );
}
