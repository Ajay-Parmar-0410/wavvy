import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
  integer,
  bigint,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * Clerk owns the auth record; we mirror the id so we can foreign-key to it.
 * We intentionally use `text` (not uuid) — Clerk user ids look like `user_abc...`.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false).notNull(),
    coverKind: text("cover_kind").default("auto").notNull(), // 'auto' | 'custom'
    coverUrl: text("cover_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("playlists_user_idx").on(t.userId),
    userUpdatedIdx: index("playlists_user_updated_idx").on(
      t.userId,
      t.updatedAt
    ),
  })
);

/**
 * song_json stores a denormalized snapshot of the Song object at the moment of
 * add. Song metadata from JioSaavn/YouTube is ephemeral — if a remote id
 * disappears, the user's playlist still renders.
 */
export const playlistSongs = pgTable(
  "playlist_songs",
  {
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
    songJson: jsonb("song_json").notNull(),
    position: integer("position").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playlistId, t.songId] }),
    playlistPosIdx: index("playlist_songs_playlist_position_idx").on(
      t.playlistId,
      t.position
    ),
  })
);

export const likedSongs = pgTable(
  "liked_songs",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
    songJson: jsonb("song_json").notNull(),
    likedAt: timestamp("liked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.songId] }),
    userLikedIdx: index("liked_songs_user_liked_idx").on(t.userId, t.likedAt),
  })
);

export const playHistory = pgTable(
  "play_history",
  {
    id: bigint("id", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    songId: text("song_id").notNull(),
    songJson: jsonb("song_json").notNull(),
    playedAt: timestamp("played_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    durationListenedMs: integer("duration_listened_ms"),
  },
  (t) => ({
    userPlayedIdx: index("play_history_user_played_idx").on(
      t.userId,
      t.playedAt
    ),
  })
);

export const recentSearches = pgTable(
  "recent_searches",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    lastSearchedAt: timestamp("last_searched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.query] }),
    userRecentIdx: index("recent_searches_user_last_idx").on(
      t.userId,
      t.lastSearchedAt
    ),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  playlists: many(playlists),
  likedSongs: many(likedSongs),
  playHistory: many(playHistory),
  recentSearches: many(recentSearches),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, { fields: [playlists.userId], references: [users.id] }),
  songs: many(playlistSongs),
}));

export const playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id],
  }),
}));

// Re-export a marker used by server code to be sure the schema file was loaded.
export const __schemaLoaded = sql`1`;
