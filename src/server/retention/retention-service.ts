import { query } from '@/server/db/client';

export async function pruneDisposableCache() {
  const days = Number(process.env.RETENTION_DAYS ?? 30);
  const result = await query<{ id: string; local_path: string | null }>(
    `DELETE FROM tracks
     WHERE is_local = true
       AND is_liked = false
       AND is_saved = false
       AND is_protected = false
       AND last_played_at < now() - ($1 || ' days')::interval
       AND NOT EXISTS (SELECT 1 FROM playlist_tracks pt JOIN playlists p ON p.id = pt.playlist_id WHERE pt.track_id = tracks.id AND p.is_protected = true)
     RETURNING id, local_path`,
    [days]
  );
  return { removed: result.rows };
}
