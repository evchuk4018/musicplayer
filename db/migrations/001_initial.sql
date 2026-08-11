CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artists (
  id text PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  genres text[] NOT NULL DEFAULT '{}',
  similar_artist_ids text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'catalog',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS albums (
  id text PRIMARY KEY,
  title text NOT NULL,
  artist_id text NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  artist_name text NOT NULL,
  artwork_url text,
  release_year integer,
  source text NOT NULL DEFAULT 'catalog',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracks (
  id text PRIMARY KEY,
  canonical_key text NOT NULL UNIQUE,
  title text NOT NULL,
  artist_id text NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  artist_name text NOT NULL,
  album_id text REFERENCES albums(id) ON DELETE SET NULL,
  album_name text,
  artwork_url text,
  preview_url text,
  source_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  genre text,
  year integer,
  tempo numeric,
  mood text,
  energy numeric,
  is_local boolean NOT NULL DEFAULT false,
  local_path text,
  is_liked boolean NOT NULL DEFAULT false,
  is_saved boolean NOT NULL DEFAULT false,
  is_protected boolean NOT NULL DEFAULT false,
  acquired_at timestamptz,
  last_played_at timestamptz,
  play_count integer NOT NULL DEFAULT 0,
  last_exposed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tracks_search_idx ON tracks USING gin (to_tsvector('simple', title || ' ' || artist_name || ' ' || coalesce(album_name, '')));
CREATE INDEX IF NOT EXISTS tracks_artist_idx ON tracks (artist_id);
CREATE INDEX IF NOT EXISTS tracks_local_idx ON tracks (is_local);

CREATE TABLE IF NOT EXISTS playlists (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  artwork_url text,
  is_system boolean NOT NULL DEFAULT false,
  is_protected boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS playlists_user_position_idx ON playlists (user_id, position);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id text NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id text NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS playlist_tracks_order_idx ON playlist_tracks (playlist_id, position);

CREATE TABLE IF NOT EXISTS quick_dial_items (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  playlist_id text NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, playlist_id)
);

CREATE TABLE IF NOT EXISTS listening_events (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id text NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  position_seconds numeric,
  completion_percent numeric,
  context text,
  metadata jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listening_events_user_time_idx ON listening_events (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS listening_events_track_idx ON listening_events (track_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS recent_searches (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query text NOT NULL,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, query)
);

CREATE TABLE IF NOT EXISTS acquisition_jobs (
  id text PRIMARY KEY,
  canonical_key text NOT NULL UNIQUE,
  track_id text NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  provider text NOT NULL DEFAULT 'spotdl',
  attempts integer NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0,
  error text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_attempt_at timestamptz,
  cancel_requested boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS acquisition_jobs_status_idx ON acquisition_jobs (status, queued_at);

INSERT INTO users (id, display_name)
VALUES ('default', 'Evan Holovachuk')
ON CONFLICT (id) DO NOTHING;

INSERT INTO playlists (id, user_id, name, description, artwork_url, is_system, is_protected, position)
VALUES ('liked', 'default', 'Liked Music', 'Your one-tap favorites', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85', true, true, 0)
ON CONFLICT (id) DO NOTHING;
