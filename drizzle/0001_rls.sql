-- Row-Level Security policies scoped to the Clerk user id encoded in the
-- `sub` claim of the Supabase-compatible JWT issued by Clerk.
--
-- Clerk's Supabase JWT template stamps the Clerk user id into `sub`, so we
-- key RLS off `auth.jwt() ->> 'sub'` instead of the default `auth.uid()`
-- (which expects a uuid from Supabase Auth).
--
-- All server reads/writes happen through the service_role client (which
-- bypasses RLS), but RLS is still our last-line defense if a token leaks or
-- we later let clients query Supabase directly.

ALTER TABLE "users"           ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "playlists"       ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "playlist_songs"  ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "liked_songs"     ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "play_history"    ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "recent_searches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- users: each user can read / modify only their own row.
CREATE POLICY "users_self_select" ON "users"
  FOR SELECT USING (id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "users_self_insert" ON "users"
  FOR INSERT WITH CHECK (id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "users_self_update" ON "users"
  FOR UPDATE USING (id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "users_self_delete" ON "users"
  FOR DELETE USING (id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint

-- playlists: scoped by user_id.
CREATE POLICY "playlists_self_select" ON "playlists"
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "playlists_self_insert" ON "playlists"
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "playlists_self_update" ON "playlists"
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "playlists_self_delete" ON "playlists"
  FOR DELETE USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint

-- playlist_songs: piggyback on the parent playlist's user_id.
CREATE POLICY "playlist_songs_self_select" ON "playlist_songs"
  FOR SELECT USING (
    playlist_id IN (
      SELECT id FROM playlists WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );
--> statement-breakpoint
CREATE POLICY "playlist_songs_self_insert" ON "playlist_songs"
  FOR INSERT WITH CHECK (
    playlist_id IN (
      SELECT id FROM playlists WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );
--> statement-breakpoint
CREATE POLICY "playlist_songs_self_update" ON "playlist_songs"
  FOR UPDATE USING (
    playlist_id IN (
      SELECT id FROM playlists WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );
--> statement-breakpoint
CREATE POLICY "playlist_songs_self_delete" ON "playlist_songs"
  FOR DELETE USING (
    playlist_id IN (
      SELECT id FROM playlists WHERE user_id = (auth.jwt() ->> 'sub')
    )
  );
--> statement-breakpoint

-- liked_songs: scoped by user_id.
CREATE POLICY "liked_songs_self_select" ON "liked_songs"
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "liked_songs_self_insert" ON "liked_songs"
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "liked_songs_self_update" ON "liked_songs"
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "liked_songs_self_delete" ON "liked_songs"
  FOR DELETE USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint

-- play_history: scoped by user_id.
CREATE POLICY "play_history_self_select" ON "play_history"
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "play_history_self_insert" ON "play_history"
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "play_history_self_update" ON "play_history"
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "play_history_self_delete" ON "play_history"
  FOR DELETE USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint

-- recent_searches: scoped by user_id.
CREATE POLICY "recent_searches_self_select" ON "recent_searches"
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "recent_searches_self_insert" ON "recent_searches"
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "recent_searches_self_update" ON "recent_searches"
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub'));
--> statement-breakpoint
CREATE POLICY "recent_searches_self_delete" ON "recent_searches"
  FOR DELETE USING (user_id = (auth.jwt() ->> 'sub'));
