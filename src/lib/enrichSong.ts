import type { Song } from "@/types";

function needsEnrichment(song: Song): boolean {
  return !song.duration || song.duration <= 0 || !song.streamUrl;
}

/**
 * Autocomplete search returns trimmed song data (duration, streamUrl, albumId
 * often missing). Before persisting a song to a playlist or liked-songs we
 * hydrate the missing fields via song.getDetails. Returns the original song
 * unchanged when enrichment isn't needed or the lookup fails.
 */
export async function enrichSong(song: Song): Promise<Song> {
  if (!needsEnrichment(song)) return song;
  if (song.source !== "saavn" || !song.sourceId) return song;

  try {
    const res = await fetch(`/api/saavn/song/${song.sourceId}`);
    if (!res.ok) return song;
    const json = await res.json();
    if (!json.success || !json.data) return song;
    const full: Song = json.data;
    return {
      ...song,
      duration: full.duration || song.duration,
      streamUrl: full.streamUrl || song.streamUrl,
      downloadUrl: full.downloadUrl || song.downloadUrl,
      album: song.album || full.album,
      albumId: song.albumId || full.albumId,
      artistId: song.artistId || full.artistId,
      imageHq: song.imageHq || full.imageHq,
      year: song.year || full.year,
      language: song.language || full.language,
      hasLyrics: song.hasLyrics || full.hasLyrics,
    };
  } catch {
    return song;
  }
}
