export type MusicSource = "saavn" | "youtube";

export type RepeatMode = "off" | "all" | "one";

export type DownloadQuality = "96" | "160" | "320";

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  duration: number;
  image: string;
  imageHq: string;
  streamUrl?: string;
  downloadUrl?: Record<DownloadQuality, string>;
  hasLyrics: boolean;
  language?: string;
  year?: string;
  source: MusicSource;
  sourceId: string;
  playCount?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}

export interface QueueState {
  songs: Song[];
  currentIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
}

export interface HistoryEntry {
  id?: number;
  song: Song;
  playedAt: number;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  image: string;
  imageHq: string;
  year?: string;
  songs: Song[];
  source: MusicSource;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  imageHq: string;
  bio?: string;
  source: MusicSource;
}

export interface SearchResults {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}
