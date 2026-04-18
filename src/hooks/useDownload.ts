"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { DownloadMeta } from "@/lib/db";
import type { Song, DownloadQuality } from "@/types";

const CACHE_NAME = "wavvy-offline-songs";

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDownloads = useCallback(async () => {
    try {
      const all = await db.downloads.orderBy("cachedAt").reverse().toArray();
      setDownloads(all);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const isDownloaded = useCallback(
    (songId: string) => downloads.some((d) => d.id === songId),
    [downloads]
  );

  const removeDownload = useCallback(
    async (songId: string) => {
      try {
        // Remove from Cache API
        if ("caches" in window) {
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          for (const key of keys) {
            if (key.url.includes(songId)) {
              await cache.delete(key);
            }
          }
        }
        // Remove from IndexedDB
        await db.downloads.delete(songId);
        setDownloads((prev) => prev.filter((d) => d.id !== songId));
      } catch {
        // silently fail
      }
    },
    []
  );

  const clearAllDownloads = useCallback(async () => {
    try {
      if ("caches" in window) {
        await caches.delete(CACHE_NAME);
      }
      await db.downloads.clear();
      setDownloads([]);
    } catch {
      // silently fail
    }
  }, []);

  return {
    downloads,
    loading,
    isDownloaded,
    removeDownload,
    clearAllDownloads,
    refresh: loadDownloads,
  };
}

interface DownloadProgress {
  songId: string;
  progress: number;
  status: "downloading" | "completed" | "error";
}

export function useDownloadSong() {
  const [activeDownloads, setActiveDownloads] = useState<
    Map<string, DownloadProgress>
  >(new Map());

  const downloadToDevice = useCallback(
    async (song: Song, quality: DownloadQuality = "320") => {
      const url = song.downloadUrl?.[quality] || song.streamUrl;
      if (!url) return false;

      try {
        setActiveDownloads((prev) => {
          const next = new Map(prev);
          next.set(song.id, {
            songId: song.id,
            progress: 0,
            status: "downloading",
          });
          return next;
        });

        const response = await fetch(url);
        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${song.title} - ${song.artist}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        setActiveDownloads((prev) => {
          const next = new Map(prev);
          next.set(song.id, {
            songId: song.id,
            progress: 100,
            status: "completed",
          });
          return next;
        });

        return true;
      } catch {
        setActiveDownloads((prev) => {
          const next = new Map(prev);
          next.set(song.id, {
            songId: song.id,
            progress: 0,
            status: "error",
          });
          return next;
        });
        return false;
      }
    },
    []
  );

  const saveOffline = useCallback(
    async (song: Song, quality: DownloadQuality = "320") => {
      const url = song.downloadUrl?.[quality] || song.streamUrl;
      if (!url) return false;

      try {
        setActiveDownloads((prev) => {
          const next = new Map(prev);
          next.set(song.id, {
            songId: song.id,
            progress: 0,
            status: "downloading",
          });
          return next;
        });

        // Fetch and cache the audio
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch audio");

        const blob = await response.blob();

        if ("caches" in window) {
          const cache = await caches.open(CACHE_NAME);
          const cacheResponse = new Response(blob, {
            headers: {
              "Content-Type": "audio/mpeg",
              "X-Song-Id": song.id,
            },
          });
          await cache.put(`/offline/${song.id}`, cacheResponse);
        }

        // Save metadata to IndexedDB
        const meta: DownloadMeta = {
          id: song.id,
          song,
          quality,
          cachedAt: Date.now(),
          size: blob.size,
        };
        await db.downloads.put(meta);

        setActiveDownloads((prev) => {
          const next = new Map(prev);
          next.set(song.id, {
            songId: song.id,
            progress: 100,
            status: "completed",
          });
          return next;
        });

        return true;
      } catch {
        setActiveDownloads((prev) => {
          const next = new Map(prev);
          next.set(song.id, {
            songId: song.id,
            progress: 0,
            status: "error",
          });
          return next;
        });
        return false;
      }
    },
    []
  );

  const getDownloadProgress = useCallback(
    (songId: string) => activeDownloads.get(songId),
    [activeDownloads]
  );

  return {
    downloadToDevice,
    saveOffline,
    getDownloadProgress,
    activeDownloads,
  };
}

export async function getOfflineStreamUrl(songId: string): Promise<string | null> {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(`/offline/${songId}`);
    if (!response) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
