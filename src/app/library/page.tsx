"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Heart,
  Music,
  Library,
  Search as SearchIcon,
  LayoutGrid,
  List as ListIcon,
  X,
  ArrowDownUp,
  UserPlus,
  Headphones,
  Ticket,
  Upload,
} from "lucide-react";
import { usePlaylists } from "@/hooks/usePlaylist";
import CreatePlaylistModal from "@/components/playlist/CreatePlaylistModal";
import { cn } from "@/lib/utils";
import type { Playlist } from "@/types";

type Filter = "all" | "playlists" | "artists" | "albums";
type ViewMode = "list" | "grid";
type SortKey = "recents" | "recently-added" | "alphabetical" | "creator";

const SORT_LABELS: Record<SortKey, string> = {
  recents: "Recents",
  "recently-added": "Recently added",
  alphabetical: "Alphabetical",
  creator: "Creator",
};

export default function LibraryPage() {
  const { playlists, loading, createPlaylist } = usePlaylists();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortKey, setSortKey] = useState<SortKey>("recents");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedPlaylists = useMemo(() => {
    const list = [...playlists];
    switch (sortKey) {
      case "alphabetical":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "recently-added":
        return list.sort((a, b) => b.createdAt - a.createdAt);
      case "recents":
      default:
        return list.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }, [playlists, sortKey]);

  const filteredPlaylists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedPlaylists;
    return sortedPlaylists.filter((p) => p.name.toLowerCase().includes(q));
  }, [sortedPlaylists, searchQuery]);

  const handleFilterClick = (f: Filter) => {
    setFilter((prev) => (prev === f ? "all" : f));
  };

  const cycleSort = () => {
    const keys: SortKey[] = [
      "recents",
      "recently-added",
      "alphabetical",
      "creator",
    ];
    const idx = keys.indexOf(sortKey);
    setSortKey(keys[(idx + 1) % keys.length]);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl md:text-2xl font-bold text-text-primary">
          Your Library
        </h1>
        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            aria-label="Search library"
            onClick={() => setSearchOpen((s) => !s)}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Create"
            onClick={() => setShowCreate(true)}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {filter !== "all" && (
          <button
            type="button"
            onClick={() => setFilter("all")}
            aria-label="Clear filter"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-bg-tertiary text-text-secondary hover:text-text-primary flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {(["playlists", "artists", "albums"] as const).map((f) => {
          if (filter !== "all" && filter !== f) return null;
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => handleFilterClick(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-text-primary text-bg-primary"
                  : "bg-bg-tertiary text-text-primary hover:bg-bg-hover"
              )}
            >
              {f === "playlists" && "Playlists"}
              {f === "artists" && "Artists"}
              {f === "albums" && "Albums"}
            </button>
          );
        })}
      </div>

      {/* Search input */}
      {searchOpen && (
        <div className="mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Your Library"
            autoFocus
            className="w-full md:max-w-sm px-3 py-2 rounded-lg bg-bg-tertiary text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent-primary/50"
          />
        </div>
      )}

      {/* Sort + view toggle */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={cycleSort}
          className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowDownUp className="w-3.5 h-3.5" />
          {SORT_LABELS[sortKey]}
        </button>
        <button
          type="button"
          aria-label={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
          onClick={() => setViewMode((v) => (v === "list" ? "grid" : "list"))}
          className="p-1.5 rounded text-text-secondary hover:text-text-primary transition-colors"
        >
          {viewMode === "list" ? (
            <LayoutGrid className="w-4 h-4" />
          ) : (
            <ListIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-12 h-12 rounded bg-bg-tertiary animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-1/2 bg-bg-tertiary rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-bg-tertiary rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : viewMode === "list" ? (
        <ul className="space-y-1">
          {filteredPlaylists.map((playlist) => (
            <PlaylistListRow key={playlist.id} playlist={playlist} />
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPlaylists.map((playlist) => (
            <PlaylistGridCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}

      {/* Add more sources */}
      <div className="mt-8 space-y-1">
        <AddSourceRow
          icon={UserPlus}
          title="Add artists"
          description="Follow artists to fill up your library"
        />
        <AddSourceRow
          icon={Headphones}
          title="Add podcasts"
          description="Discover shows and save them here"
        />
        <AddSourceRow
          icon={Ticket}
          title="Find live events"
          description="Never miss a show near you"
        />
        <AddSourceRow
          icon={Upload}
          title="Import music"
          description="Bring your playlists from other apps"
        />
      </div>

      <CreatePlaylistModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createPlaylist}
      />
    </div>
  );
}

function PlaylistListRow({ playlist }: { playlist: Playlist }) {
  const meta =
    playlist.songs.length === 1
      ? "Playlist · 1 song"
      : `Playlist · ${playlist.songs.length} songs`;
  return (
    <li>
      <Link
        href={`/playlist/${playlist.id}`}
        className="flex items-center gap-3 p-2 rounded-md hover:bg-bg-tertiary/60 transition-colors"
      >
        <div className="relative w-12 h-12 rounded overflow-hidden bg-bg-tertiary flex-shrink-0">
          {playlist.isDefault ? (
            <div className="w-full h-full bg-gradient-to-br from-accent-secondary to-accent-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
          ) : playlist.songs[0]?.image ? (
            <Image
              src={playlist.songs[0].image}
              alt={playlist.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-5 h-5 text-text-muted" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {playlist.name}
          </p>
          <p className="text-xs text-text-secondary truncate">{meta}</p>
        </div>
      </Link>
    </li>
  );
}

function PlaylistGridCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group flex flex-col gap-2 p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors"
    >
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-bg-tertiary">
        {playlist.isDefault ? (
          <div className="w-full h-full bg-gradient-to-br from-accent-secondary to-accent-primary flex items-center justify-center">
            <Heart className="w-12 h-12 text-white fill-white" />
          </div>
        ) : playlist.songs[0]?.image ? (
          <Image
            src={playlist.songs[0].image}
            alt={playlist.name}
            fill
            className="object-cover"
            sizes="200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-12 h-12 text-text-muted" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-text-primary truncate">
        {playlist.name}
      </p>
      <p className="text-xs text-text-secondary">
        {playlist.songs.length} song{playlist.songs.length !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}

interface AddSourceRowProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function AddSourceRow({ icon: Icon, title, description }: AddSourceRowProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-bg-tertiary/60 transition-colors text-left"
    >
      <span className="w-12 h-12 rounded bg-bg-tertiary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-text-secondary" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-text-primary truncate">
          {title}
        </span>
        <span className="block text-xs text-text-secondary truncate">
          {description}
        </span>
      </span>
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
        <Library className="w-8 h-8 text-text-muted" />
      </div>
      <h2 className="font-heading text-lg font-semibold text-text-primary mb-2">
        Your playlists will appear here
      </h2>
      <p className="text-text-secondary text-sm max-w-sm mb-4">
        Create playlists and save your favorite songs.
      </p>
      <button
        onClick={onCreate}
        className="px-4 py-2 rounded-full bg-accent-primary text-bg-primary text-sm font-medium hover:brightness-110 transition-all"
      >
        Create your first playlist
      </button>
    </div>
  );
}
