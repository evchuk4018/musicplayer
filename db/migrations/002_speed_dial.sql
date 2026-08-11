CREATE TABLE IF NOT EXISTS speed_dial_items (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('track', 'playlist')),
  track_id text REFERENCES tracks(id) ON DELETE CASCADE,
  playlist_id text REFERENCES playlists(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_key),
  CHECK (
    (item_type = 'track' AND track_id IS NOT NULL AND playlist_id IS NULL)
    OR (item_type = 'playlist' AND playlist_id IS NOT NULL AND track_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS speed_dial_items_user_position_idx ON speed_dial_items (user_id, position);

INSERT INTO speed_dial_items (user_id, item_key, item_type, playlist_id, position)
SELECT user_id, 'playlist:' || playlist_id, 'playlist', playlist_id, position
FROM quick_dial_items
ON CONFLICT (user_id, item_key) DO NOTHING;
