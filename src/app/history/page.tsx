"use client";

import { useState } from "react";
import { Clock, Trash2, TrendingUp } from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { useLikedSongs } from "@/hooks/usePlaylist";
import SongRow from "@/components/song/SongRow";
import SongCard from "@/components/song/SongCard";
import SongContextMenu from "@/components/song/SongContextMenu";
import AddToPlaylistModal from "@/components/playlist/AddToPlaylistModal";
import type { Song } from "@/types";

export default function HistoryPage() {
  const { history, mostPlayed, loading, clearHistory } = useHistory();
  const { isLiked, toggleLike } = useLikedSongs();

  const [contextMenu, setContextMenu] = useState<{
    song: Song;
    position: { x: number; y: number };
  } | null>(null);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<Song | null>(null);

  const handleContextMenu = (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ song, position: { x: e.clientX, y: e.clientY } });
  };

  // Deduplicate recent history (show each song once, most recent first)
  const recentSongs: Song[] = [];
  const seenIds = new Set<string>();
  for (const entry of history) {
    if (!seenIds.has(entry.song.id)) {
      seenIds.add(entry.song.id);
      recentSongs.push(entry.song);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Recently Played
        </h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
              <div className="w-10 h-10 bg-bg-tertiary rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-bg-tertiary rounded" />
                <div className="h-3 w-1/2 bg-bg-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-2">
            No listening history yet
          </h2>
          <p className="text-text-secondary text-sm max-w-sm">
            Songs you play will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Most Played */}
          {mostPlayed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent-primary" />
                <h2 className="font-heading text-lg font-semibold text-text-primary">
                  Most Played
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {mostPlayed.slice(0, 10).map((song, i) => (
                  <div key={song.id} className="relative">
                    <SongCard song={song} queue={mostPlayed} index={i} />
                    <span className="absolute top-4 left-4 bg-bg-primary/80 text-accent-primary text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                      {song.playCount}x
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent History */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
              Recent
            </h2>
            <div className="space-y-0.5">
              {recentSongs.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={i}
                  queue={recentSongs}
                  onContextMenu={handleContextMenu}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Context Menu */}
      <SongContextMenu
        song={contextMenu?.song ?? null}
        position={contextMenu?.position ?? null}
        isLiked={contextMenu?.song ? isLiked(contextMenu.song.id) : false}
        onClose={() => setContextMenu(null)}
        onAddToPlaylist={(song) => {
          setContextMenu(null);
          setAddToPlaylistSong(song);
        }}
        onToggleLike={(song) => toggleLike(song)}
      />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={!!addToPlaylistSong}
        song={addToPlaylistSong}
        onClose={() => setAddToPlaylistSong(null)}
      />
    </div>
  );
}
