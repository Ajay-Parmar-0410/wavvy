"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Heart, Music, Library } from "lucide-react";
import { usePlaylists } from "@/hooks/usePlaylist";
import CreatePlaylistModal from "@/components/playlist/CreatePlaylistModal";

export default function LibraryPage() {
  const { playlists, loading, createPlaylist } = usePlaylists();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Your Library
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Playlist
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-3">
              <div className="aspect-square w-full rounded-md bg-bg-tertiary animate-pulse" />
              <div className="h-3.5 w-3/4 bg-bg-tertiary rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-bg-tertiary rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
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
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-full bg-accent-primary text-bg-primary text-sm font-medium hover:brightness-110 transition-all"
          >
            Create your first playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group flex flex-col gap-2 p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors"
            >
              {/* Cover */}
              <div className="relative aspect-square w-full rounded-md overflow-hidden bg-bg-tertiary">
                {playlist.isDefault ? (
                  <div className="w-full h-full bg-gradient-to-br from-accent-secondary to-accent-primary flex items-center justify-center">
                    <Heart className="w-12 h-12 text-white fill-white" />
                  </div>
                ) : playlist.songs.length > 0 ? (
                  <PlaylistCover songs={playlist.songs} />
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
          ))}
        </div>
      )}

      <CreatePlaylistModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createPlaylist}
      />
    </div>
  );
}

function PlaylistCover({ songs }: { songs: { image: string; title: string }[] }) {
  const images = songs.slice(0, 4);

  if (images.length < 4) {
    return (
      <Image
        src={images[0].image}
        alt="Playlist cover"
        fill
        className="object-cover"
        sizes="200px"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 w-full h-full">
      {images.map((song, i) => (
        <div key={i} className="relative">
          <Image
            src={song.image}
            alt={song.title}
            fill
            className="object-cover"
            sizes="100px"
          />
        </div>
      ))}
    </div>
  );
}
