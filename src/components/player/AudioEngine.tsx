"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { db } from "@/lib/db";
import { getOfflineStreamUrl } from "@/hooks/useDownload";

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekingRef = useRef(false);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const currentTime = usePlayerStore((s) => s.currentTime);

  const setDuration = usePlayerStore((s) => s.setDuration);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const playNext = usePlayerStore((s) => s.playNext);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }

    const audio = audioRef.current;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => {
      if (!seekingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onEnded = () => playNext();
    const onError = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [setDuration, setCurrentTime, setIsPlaying, playNext]);

  // Load new song + record history
  const lastRecordedId = useRef<string | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    let cancelled = false;

    async function loadSong() {
      let url = currentSong!.streamUrl;

      // Try offline cache first
      const offlineUrl = await getOfflineStreamUrl(currentSong!.id);
      if (offlineUrl) {
        url = offlineUrl;
      }

      // For songs without a stream URL, fetch on-demand
      if (!url) {
        try {
          if (currentSong!.source === "youtube") {
            const res = await fetch(`/api/yt/stream/${currentSong!.sourceId}`);
            const json = await res.json();
            if (json.success) {
              url = json.data.streamUrl;
            }
          } else if (currentSong!.source === "saavn") {
            const res = await fetch(`/api/saavn/song/${currentSong!.sourceId}`);
            const json = await res.json();
            if (json.success && json.data.streamUrl) {
              url = json.data.streamUrl;
            }
          }
        } catch {
          if (!cancelled) setIsPlaying(false);
          return;
        }
      }

      if (cancelled) return;

      if (!url) {
        setIsPlaying(false);
        return;
      }

      audio!.src = url;
      audio!.load();

      // If user intended to play, kick off playback now that src is ready
      if (usePlayerStore.getState().isPlaying) {
        audio!.play().catch(() => setIsPlaying(false));
      }

      // Record play in history (avoid duplicate for same song)
      if (currentSong!.id !== lastRecordedId.current) {
        lastRecordedId.current = currentSong!.id;
        db.history.add({ song: currentSong!, playedAt: Date.now() });
      }
    }

    loadSong();
    return () => {
      cancelled = true;
    };
  }, [currentSong, setIsPlaying]);

  // Play/pause — only acts when audio has already loaded a source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Seek — detect store-driven seek (user dragged the seek bar)
  const lastStoreTime = useRef(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const diff = Math.abs(currentTime - audio.currentTime);
    // Only seek if the store time diverges significantly (user-initiated seek)
    if (diff > 1.5) {
      audio.currentTime = currentTime;
    }
    lastStoreTime.current = currentTime;
  }, [currentTime]);

  // Media Session API (lock screen controls)
  const handleMediaAction = useCallback(
    (action: string) => {
      const store = usePlayerStore.getState();
      switch (action) {
        case "play":
          store.setIsPlaying(true);
          break;
        case "pause":
          store.setIsPlaying(false);
          break;
        case "previoustrack":
          store.playPrevious();
          break;
        case "nexttrack":
          store.playNext();
          break;
      }
    },
    []
  );

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentSong) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album,
      artwork: [
        { src: currentSong.image, sizes: "96x96", type: "image/jpeg" },
        { src: currentSong.imageHq, sizes: "512x512", type: "image/jpeg" },
      ],
    });

    const actions: MediaSessionAction[] = [
      "play",
      "pause",
      "previoustrack",
      "nexttrack",
    ];
    actions.forEach((action) => {
      navigator.mediaSession.setActionHandler(action, () =>
        handleMediaAction(action)
      );
    });
  }, [currentSong, handleMediaAction]);

  return null;
}
