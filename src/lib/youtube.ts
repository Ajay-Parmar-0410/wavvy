/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Song } from "@/types";

const PIPED_INSTANCES = [
  "https://pipedapi.wireway.ch",
  "https://pipedapi.tokhmi.xyz",
  "https://api.piped.projectsegfau.lt",
];

async function fetchPiped(path: string): Promise<any> {
  let lastError: Error | null = null;

  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}${path}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const text = await res.text();
        if (!text || text.startsWith("<") || text.startsWith("Service")) {
          continue; // HTML or shutdown page, skip to next instance
        }
        return JSON.parse(text);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("All Piped instances failed");
}

function extractVideoId(url: string): string {
  // Piped returns relative URLs like /watch?v=VIDEO_ID
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : url;
}

function parsePipedSong(item: any): Song {
  const videoId = extractVideoId(item.url || "");
  const durationSec = item.duration || 0;

  return {
    id: `yt-${videoId}`,
    title: item.title || "",
    artist: item.uploaderName || item.uploader || "",
    artistId: undefined,
    album: "",
    albumId: undefined,
    duration: durationSec,
    image: item.thumbnail || "",
    imageHq: item.thumbnail || "",
    streamUrl: undefined, // Will be fetched on play
    hasLyrics: false,
    language: undefined,
    year: undefined,
    source: "youtube",
    sourceId: videoId,
  };
}

export async function searchYouTube(query: string): Promise<Song[]> {
  const data = await fetchPiped(
    `/search?q=${encodeURIComponent(query)}&filter=music_songs`
  );

  const items: any[] = data.items || [];
  return items
    .filter((item: any) => item.type === "stream")
    .map(parsePipedSong);
}

export async function getYouTubeStreamUrl(videoId: string): Promise<{
  streamUrl: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
} | null> {
  const data = await fetchPiped(`/streams/${videoId}`);

  if (!data) return null;

  // Find best audio-only stream
  const audioStreams: any[] = data.audioStreams || [];
  const bestAudio = audioStreams
    .filter((s: any) => s.mimeType?.startsWith("audio/"))
    .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

  if (!bestAudio) return null;

  return {
    streamUrl: bestAudio.url,
    title: data.title || "",
    artist: data.uploader || "",
    duration: data.duration || 0,
    thumbnail: data.thumbnailUrl || "",
  };
}

export async function getYouTubeVideoInfo(videoId: string): Promise<Song | null> {
  const data = await fetchPiped(`/streams/${videoId}`);
  if (!data) return null;

  const audioStreams: any[] = data.audioStreams || [];
  const bestAudio = audioStreams
    .filter((s: any) => s.mimeType?.startsWith("audio/"))
    .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

  return {
    id: `yt-${videoId}`,
    title: data.title || "",
    artist: data.uploader || "",
    album: "",
    duration: data.duration || 0,
    image: data.thumbnailUrl || "",
    imageHq: data.thumbnailUrl || "",
    streamUrl: bestAudio?.url || undefined,
    hasLyrics: false,
    source: "youtube",
    sourceId: videoId,
  };
}
