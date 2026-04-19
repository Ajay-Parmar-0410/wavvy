"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Search as SearchIcon, Music2, User, Disc3 } from "lucide-react";
import {
  getRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
  type RecentSearchEntry,
} from "@/lib/recentSearches";
import { cn } from "@/lib/utils";

interface RecentSearchesProps {
  onPick?: (entry: RecentSearchEntry) => void;
  limit?: number;
}

const KIND_ICON = {
  song: Music2,
  album: Disc3,
  artist: User,
  query: SearchIcon,
} as const;

export default function RecentSearches({ onPick, limit = 10 }: RecentSearchesProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<RecentSearchEntry[]>([]);

  useEffect(() => {
    setEntries(getRecentSearches());
  }, []);

  if (entries.length === 0) return null;

  const handlePick = (entry: RecentSearchEntry) => {
    if (onPick) {
      onPick(entry);
      return;
    }
    switch (entry.kind) {
      case "song":
        router.push(`/song/${entry.id}`);
        return;
      case "album":
        router.push(`/album/${entry.id}`);
        return;
      case "artist":
        router.push(`/artist/${entry.id}`);
        return;
      case "query":
        router.push(`/search?q=${encodeURIComponent(entry.title)}`);
        return;
    }
  };

  const handleRemove = (e: React.MouseEvent, entry: RecentSearchEntry) => {
    e.stopPropagation();
    const next = removeRecentSearch(entry.kind, entry.id);
    setEntries(next);
  };

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary">
          Recent searches
        </h2>
        <button
          type="button"
          onClick={() => {
            clearRecentSearches();
            setEntries([]);
          }}
          className="text-xs font-semibold text-text-secondary hover:underline"
        >
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {entries.slice(0, limit).map((entry) => {
          const Icon = KIND_ICON[entry.kind];
          const circular = entry.kind === "artist";
          return (
            <div
              key={`${entry.kind}-${entry.id}`}
              role="button"
              tabIndex={0}
              onClick={() => handlePick(entry)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePick(entry);
                }
              }}
              className="group relative p-3 rounded-lg bg-bg-tertiary/70 hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <button
                type="button"
                aria-label={`Remove "${entry.title}" from recent searches`}
                onClick={(e) => handleRemove(e, entry)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div
                className={cn(
                  "relative aspect-square overflow-hidden bg-bg-tertiary mb-3",
                  circular ? "rounded-full" : "rounded-md"
                )}
              >
                {entry.kind !== "query" && entry.image ? (
                  <Image
                    src={entry.image}
                    alt={entry.title}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-text-muted" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-text-primary truncate">
                {entry.title}
              </p>
              <p className="text-xs text-text-muted capitalize truncate">
                {entry.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
