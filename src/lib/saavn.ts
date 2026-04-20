/* eslint-disable @typescript-eslint/no-explicit-any */
import CryptoJS from "crypto-js";
import type { Song, Album, Artist, SearchResults, DownloadQuality } from "@/types";

const JIOSAAVN_BASE = "https://www.jiosaavn.com/api.php";
const DES_KEY = CryptoJS.enc.Utf8.parse("38346591");

const BASE_PARAMS = {
  _format: "json",
  _marker: "0",
  api_version: "4",
  ctx: "web6dot0",
};

function buildUrl(call: string, params: Record<string, string> = {}): string {
  const searchParams = new URLSearchParams({
    __call: call,
    ...BASE_PARAMS,
    ...params,
  });
  return `${JIOSAAVN_BASE}?${searchParams.toString()}`;
}

export function decryptUrl(encryptedUrl: string): string {
  const decrypted = CryptoJS.DES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) } as CryptoJS.lib.CipherParams,
    DES_KEY,
    { mode: CryptoJS.mode.ECB }
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
}

function getDownloadUrls(encryptedUrl: string, has320: boolean): Record<DownloadQuality, string> {
  const base = decryptUrl(encryptedUrl);
  return {
    "96": base,
    "160": base.replace("_96", "_160"),
    "320": has320 ? base.replace("_96", "_320") : base.replace("_96", "_160"),
  };
}

function sanitizeImageUrl(url: string, quality: "50x50" | "150x150" | "500x500" = "150x150"): string {
  if (!url) return "";
  return url.replace(/150x150|50x50|500x500/, quality).replace("http:", "https:");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSong(raw: any): Song {
  const hasEncrypted = raw.more_info?.encrypted_media_url;
  const has320 = raw.more_info?.["320kbps"] === "true";

  return {
    id: raw.id,
    title: decodeEntities(raw.title || raw.song || raw.name || ""),
    artist: decodeEntities(
      raw.more_info?.artistMap?.primary_artists
        ?.map((a: { name: string }) => a.name)
        .join(", ") ||
      raw.subtitle ||
      raw.primary_artists ||
      ""
    ),
    artistId: raw.more_info?.artistMap?.primary_artists?.[0]?.id,
    album: decodeEntities(raw.more_info?.album || ""),
    albumId: raw.more_info?.album_id,
    duration: parseInt(raw.more_info?.duration || raw.duration || "0", 10),
    image: sanitizeImageUrl(raw.image, "150x150"),
    imageHq: sanitizeImageUrl(raw.image, "500x500"),
    streamUrl: hasEncrypted
      ? getDownloadUrls(hasEncrypted, has320)["320"] ||
        getDownloadUrls(hasEncrypted, has320)["160"]
      : undefined,
    downloadUrl: hasEncrypted ? getDownloadUrls(hasEncrypted, has320) : undefined,
    hasLyrics: raw.more_info?.has_lyrics === "true",
    language: raw.language || raw.more_info?.language,
    year: raw.year || raw.more_info?.year,
    source: "saavn",
    sourceId: raw.id,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAlbum(raw: any): Album {
  return {
    id: raw.id || raw.albumid,
    name: decodeEntities(raw.title || raw.name || ""),
    artist: decodeEntities(
      raw.subtitle || raw.more_info?.music || raw.more_info?.artistMap?.primary_artists?.[0]?.name || ""
    ),
    artistId: raw.more_info?.artistMap?.primary_artists?.[0]?.id,
    image: sanitizeImageUrl(raw.image, "150x150"),
    imageHq: sanitizeImageUrl(raw.image, "500x500"),
    year: raw.year || raw.more_info?.year,
    songs: (raw.list || []).map(parseSong),
    source: "saavn",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseArtist(raw: any): Artist {
  return {
    id: raw.id || raw.artistId,
    name: decodeEntities(raw.title || raw.name || ""),
    image: sanitizeImageUrl(raw.image, "150x150"),
    imageHq: sanitizeImageUrl(raw.image, "500x500"),
    bio: Array.isArray(raw.bio)
      ? raw.bio.map((b: { text: string }) => b.text).join(" ")
      : typeof raw.bio === "string"
        ? raw.bio
        : undefined,
    source: "saavn",
  };
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ── Fetch helpers (server-side only) ──

async function fetchSaavn(call: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = buildUrl(call, params);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`JioSaavn API error: ${res.status}`);
  return res.json();
}

export async function searchSaavn(query: string): Promise<SearchResults> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("autocomplete.get", {
    query,
    cc: "in",
    includeMetaTags: "1",
  })) as any;

  return {
    songs: (data.songs?.data || []).map(parseSong),
    albums: (data.albums?.data || []).map(parseAlbum),
    artists: (data.artists?.data || []).map(parseArtist),
  };
}

export async function searchSongs(query: string, page = 1, limit = 20): Promise<Song[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("search.getResults", {
    q: query,
    p: String(page),
    n: String(limit),
  })) as any;
  return (data.results || []).map(parseSong);
}

export async function searchAlbumsApi(query: string, limit = 10): Promise<Album[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("search.getAlbumResults", {
    q: query,
    p: "1",
    n: String(limit),
  })) as any;
  return (data.results || []).map(parseAlbum);
}

export async function searchArtistsApi(query: string, limit = 10): Promise<Artist[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("search.getArtistResults", {
    q: query,
    p: "1",
    n: String(limit),
  })) as any;
  return (data.results || []).map(parseArtist);
}

// Full relevance-ranked search across all types — used for the search page.
// The existing searchSaavn() (autocomplete) is kept for instant dropdown hints.
export async function searchAll(query: string): Promise<SearchResults> {
  const [songs, albums, artists] = await Promise.all([
    searchSongs(query, 1, 20),
    searchAlbumsApi(query, 10),
    searchArtistsApi(query, 10),
  ]);
  return { songs, albums, artists };
}

export async function getSongById(id: string): Promise<Song | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("song.getDetails", {
    pids: id,
    cc: "in",
  })) as any;
  const songs = Object.values(data.songs || data || {});
  if (songs.length === 0) return null;
  return parseSong(songs[0]);
}

export async function getAlbumById(id: string): Promise<Album | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("content.getAlbumDetails", {
    albumid: id,
    cc: "in",
  })) as any;
  if (!data || !data.id) return null;
  return parseAlbum(data);
}

export async function getPlaylistById(id: string, page = 1, limit = 50): Promise<{
  id: string;
  name: string;
  description: string;
  image: string;
  imageHq: string;
  songs: Song[];
  songCount: number;
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("playlist.getDetails", {
    listid: id,
    cc: "in",
    n: String(limit),
    p: String(page),
  })) as any;
  if (!data || !data.id) return null;
  return {
    id: data.id,
    name: decodeEntities(data.title || data.listname || ""),
    description: decodeEntities(data.description || data.subtitle || ""),
    image: sanitizeImageUrl(data.image, "150x150"),
    imageHq: sanitizeImageUrl(data.image, "500x500"),
    songs: (data.list || []).map(parseSong),
    songCount: parseInt(data.list_count || "0", 10),
  };
}

export async function getLyrics(id: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("lyrics.getLyrics", {
    lyrics_id: id,
  })) as any;
  return data?.lyrics || null;
}

export async function getArtistById(id: string): Promise<{
  artist: Artist;
  topSongs: Song[];
  topAlbums: Album[];
  singles: Album[];
  similarArtists: Artist[];
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("artist.getArtistPageDetails", {
    artistId: id,
    n_song: "20",
    n_album: "20",
    page: "1",
    category: "popularity",
    sort_order: "desc",
  })) as any;

  // JioSaavn returns the artist node with either `artistId` or `id` depending
  // on the variant. Some responses wrap a `name` without either when the id is
  // a slug — fall back to the `name` presence check so slugs don't 404.
  const looksLikeArtist =
    !!data && (data.artistId || data.id || data.name || data.title);
  if (!looksLikeArtist) return null;

  const artistBase = {
    ...data,
    id: data.artistId || data.id || id,
  };

  // Singles / dedicated playlists come back under different keys depending on
  // the API shape — normalise here so the UI can rely on a single structure.
  const singlesRaw = data.singles || data.topSingles || [];
  const similarRaw = data.similarArtists || data.similar_artists || [];

  return {
    artist: parseArtist(artistBase),
    topSongs: (data.topSongs || data.top_songs || []).map(parseSong),
    topAlbums: (data.topAlbums || data.top_albums || []).map(parseAlbum),
    singles: singlesRaw.map(parseAlbum),
    similarArtists: similarRaw.map(parseArtist),
  };
}

export async function getTrending(): Promise<{
  trending: Song[];
  albums: Album[];
  playlists: { id: string; name: string; image: string; imageHq: string }[];
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await fetchSaavn("content.getBrowseModules")) as any;

  const trending: Song[] = [];
  const albums: Album[] = [];
  const playlists: { id: string; name: string; image: string; imageHq: string }[] = [];

  // Parse new_trending or charts
  const trendingModule = data.new_trending || data.charts || [];
  if (Array.isArray(trendingModule)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trendingModule.forEach((item: any) => {
      if (item.type === "song") trending.push(parseSong(item));
      else if (item.type === "album") albums.push(parseAlbum(item));
      else if (item.type === "playlist") {
        playlists.push({
          id: item.id,
          name: decodeEntities(item.title || ""),
          image: sanitizeImageUrl(item.image, "150x150"),
          imageHq: sanitizeImageUrl(item.image, "500x500"),
        });
      }
    });
  }

  // Parse new_albums
  if (Array.isArray(data.new_albums)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.new_albums.forEach((item: any) => albums.push(parseAlbum(item)));
  }

  // Parse top_playlists
  if (Array.isArray(data.top_playlists)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.top_playlists.forEach((item: any) => {
      playlists.push({
        id: item.id,
        name: decodeEntities(item.title || ""),
        image: sanitizeImageUrl(item.image, "150x150"),
        imageHq: sanitizeImageUrl(item.image, "500x500"),
      });
    });
  }

  return { trending, albums, playlists };
}
