"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { Song, HistoryEntry } from "@/types";

const MAX_HISTORY = 100;

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mostPlayed, setMostPlayed] = useState<(Song & { playCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Recent history (newest first)
    const all = await db.history.orderBy("playedAt").reverse().limit(MAX_HISTORY).toArray();
    setHistory(all);

    // Most played — count occurrences
    const counts = new Map<string, { song: Song; count: number }>();
    const fullHistory = await db.history.toArray();
    for (const entry of fullHistory) {
      const existing = counts.get(entry.song.id);
      if (existing) {
        existing.count++;
      } else {
        counts.set(entry.song.id, { song: entry.song, count: 1 });
      }
    }

    const sorted = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map(({ song, count }) => ({ ...song, playCount: count }));

    setMostPlayed(sorted);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToHistory = useCallback(
    async (song: Song) => {
      await db.history.add({
        song,
        playedAt: Date.now(),
      });

      // Trim history to MAX_HISTORY
      const count = await db.history.count();
      if (count > MAX_HISTORY * 2) {
        const oldest = await db.history
          .orderBy("playedAt")
          .limit(count - MAX_HISTORY)
          .toArray();
        const idsToDelete = oldest
          .map((e) => e.id)
          .filter((id): id is number => id !== undefined);
        await db.history.bulkDelete(idsToDelete);
      }

      await refresh();
    },
    [refresh]
  );

  const clearHistory = useCallback(async () => {
    await db.history.clear();
    await refresh();
  }, [refresh]);

  return { history, mostPlayed, loading, addToHistory, clearHistory, refresh };
}
