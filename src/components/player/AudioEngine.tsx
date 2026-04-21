"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { db } from "@/lib/db";
import { getOfflineStreamUrl } from "@/hooks/useDownload";

const MAX_RETRIES = 3;

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekingRef = useRef(false);
  // Guard against double-advance when both `ended` and the `timeupdate`
  // fallback fire for the same song. Reset on every new song load.
  const advancedSongIdRef = useRef<string | null>(null);
  const retryRef = useRef<{
    count: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ count: 0, timer: null });

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const repeat = usePlayerStore((s) => s.repeat);

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

    const clearRetry = () => {
      if (retryRef.current.timer) {
        clearTimeout(retryRef.current.timer);
        retryRef.current.timer = null;
      }
    };

    // Advance with a per-song guard so `ended` + the `timeupdate` fallback
    // don't both fire playNext for the same track.
    const advance = () => {
      const song = usePlayerStore.getState().currentSong;
      if (!song) return;
      if (advancedSongIdRef.current === song.id) return;
      advancedSongIdRef.current = song.id;
      clearRetry();
      retryRef.current.count = 0;

      if (usePlayerStore.getState().repeat === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
        return;
      }
      playNext();
    };

    // Retry failed playback with exponential backoff (1s, 2s, 4s), preserving
    // the resume position. After MAX_RETRIES we skip forward so the queue
    // doesn't freeze on one bad stream.
    const scheduleRetry = () => {
      if (retryRef.current.count >= MAX_RETRIES) {
        retryRef.current.count = 0;
        clearRetry();
        advance();
        return;
      }
      const delay = 1000 * Math.pow(2, retryRef.current.count);
      retryRef.current.count += 1;
      clearRetry();
      retryRef.current.timer = setTimeout(() => {
        retryRef.current.timer = null;
        if (!audio.src) return;
        const resumeAt = audio.currentTime;
        audio.load();
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          if (resumeAt > 0 && isFinite(resumeAt)) {
            try {
              audio.currentTime = resumeAt;
            } catch {
              /* ignore — some streams don't support resume */
            }
          }
          audio.play().catch(() => scheduleRetry());
        };
        audio.addEventListener("canplay", onCanPlay);
      }, delay);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      advancedSongIdRef.current = null;
    };
    const onTimeUpdate = () => {
      if (!seekingRef.current) {
        setCurrentTime(audio.currentTime);
      }
      // Belt-and-suspenders auto-advance: mobile Chrome + Bluetooth routing
      // occasionally swallows the `ended` event, which breaks both the
      // natural queue advance and the repeat=all wrap-around. Detect the
      // near-end window here as a fallback.
      const duration = audio.duration;
      if (
        !audio.loop &&
        !audio.paused &&
        duration > 0 &&
        isFinite(duration) &&
        audio.currentTime >= duration - 0.25
      ) {
        advance();
      }
    };
    const onEnded = () => advance();
    const onPlaying = () => {
      retryRef.current.count = 0;
      clearRetry();
    };
    const onError = () => {
      if (audio.src && !audio.ended) scheduleRetry();
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("playing", onPlaying);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("playing", onPlaying);
      clearRetry();
    };
  }, [setDuration, setCurrentTime, setIsPlaying, playNext]);

  // Load new song + record history
  const lastRecordedId = useRef<string | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    // New song → drop any in-flight retry on the previous song's URL.
    if (retryRef.current.timer) {
      clearTimeout(retryRef.current.timer);
      retryRef.current.timer = null;
    }
    retryRef.current.count = 0;
    advancedSongIdRef.current = null;

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

  // Repeat-one → native audio loop (seamless, zero-JS-in-hot-path).
  // Plan2 §2.2 — fixes the reference-equality bug where repeat=one stopped
  // after one play because the store emitted the same currentSong ref.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = repeat === "one";
  }, [repeat]);

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
