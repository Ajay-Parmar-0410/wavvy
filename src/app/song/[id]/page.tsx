"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Heart,
  Download,
  Share2,
  Music,
  ListPlus,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { useLikedSongs } from "@/hooks/usePlaylist";
import { useDownloadSong } from "@/hooks/useDownload";
import { toast } from "@/stores/toastStore";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import type { Song } from "@/types";

export default function SongPage({ params }: { params: { id: string } }) {
  const playSong = usePlayerStore((s) => s.playSong);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const { isLiked, toggleLike } = useLikedSongs();
  const { saveOffline } = useDownloadSong();

  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSong = useCallback(async () => {
    try {
      const res = await fetch(`/api/saavn/song/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setSong(json.data);

        // Fetch lyrics if available
        if (json.data.hasLyrics) {
          const lRes = await fetch(`/api/saavn/lyrics/${params.id}`);
          const lJson = await lRes.json();
          if (lJson.success) {
            setLyrics(lJson.data.lyrics);
          }
        }
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadSong();
  }, [loadSong]);

  const isCurrentSong = currentSong?.id === song?.id;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-64 h-64 bg-bg-tertiary rounded-xl mb-6" />
          <div className="h-8 w-48 bg-bg-tertiary rounded mb-2" />
          <div className="h-4 w-32 bg-bg-tertiary rounded mb-6" />
          <div className="h-10 w-32 bg-bg-tertiary rounded-full" />
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20">
        <Music className="w-12 h-12 text-text-muted mb-3" />
        <p className="text-text-muted">Song not found</p>
      </div>
    );
  }

  const liked = isLiked(song.id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Song header */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-64 h-64 rounded-xl overflow-hidden bg-bg-secondary shadow-2xl mb-6">
          {song.imageHq ? (
            <Image
              src={song.imageHq}
              alt={song.title}
              fill
              className="object-cover"
              sizes="256px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-16 h-16 text-text-muted" />
            </div>
          )}
        </div>

        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary text-center mb-1">
          {song.title}
        </h1>

        {song.artistId ? (
          <Link
            href={`/artist/${song.artistId}`}
            className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
          >
            {song.artist}
          </Link>
        ) : (
          <p className="text-sm text-text-secondary">{song.artist}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-text-muted mt-2">
          {song.album && song.albumId ? (
            <Link
              href={`/album/${song.albumId}`}
              className="hover:text-accent-primary transition-colors"
            >
              {song.album}
            </Link>
          ) : song.album ? (
            <span>{song.album}</span>
          ) : null}
          {song.year && <span>{song.year}</span>}
          <span>{formatTime(song.duration)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => {
            if (isCurrentSong) {
              togglePlay();
            } else {
              playSong(song);
            }
          }}
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent-primary text-bg-primary font-medium text-sm hover:brightness-110 transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          {isCurrentSong && isPlaying ? "Pause" : "Play"}
        </button>

        <button
          onClick={() => {
            toggleLike(song);
            toast.success(liked ? "Removed from Liked Songs" : "Added to Liked Songs");
          }}
          className={cn(
            "p-3 rounded-full border transition-colors",
            liked
              ? "border-accent-primary text-accent-primary"
              : "border-border text-text-muted hover:text-text-primary hover:border-text-muted"
          )}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart className={cn("w-5 h-5", liked && "fill-current")} />
        </button>

        <button
          onClick={() => {
            addToQueue(song);
            toast.info(`Added "${song.title}" to queue`);
          }}
          className="p-3 rounded-full border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
          aria-label="Add to queue"
        >
          <ListPlus className="w-5 h-5" />
        </button>

        <button
          onClick={async () => {
            toast.info(`Saving "${song.title}" offline...`);
            const ok = await saveOffline(song);
            if (ok) toast.success("Saved for offline listening");
            else toast.error("Failed to save offline");
          }}
          className="p-3 rounded-full border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
          aria-label="Download"
        >
          <Download className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            toast.success("Link copied to clipboard");
          }}
          className="p-3 rounded-full border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Lyrics */}
      {lyrics && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-4">
            Lyrics
          </h2>
          <div
            className="text-text-secondary text-sm leading-7 whitespace-pre-line bg-bg-secondary rounded-xl p-6"
            dangerouslySetInnerHTML={{ __html: lyrics }}
          />
        </section>
      )}
    </div>
  );
}
