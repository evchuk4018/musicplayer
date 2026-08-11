import type { QueryResultRow } from 'pg';
import type { Track } from '@/domain/music';
import { query, withTransaction } from '@/server/db/client';

export type TrackRow = QueryResultRow & {
  id: string;
  canonical_key: string;
  title: string;
  artist_id: string;
  artist_name: string;
  album_id: string | null;
  album_name: string | null;
  artwork_url: string | null;
  preview_url: string | null;
  source_url: string | null;
  duration_seconds: number;
  genre: string | null;
  year: number | null;
  tempo: number | null;
  mood: string | null;
  energy: number | null;
  is_local: boolean;
  local_path: string | null;
  is_liked: boolean;
  is_saved: boolean;
  is_protected: boolean;
  acquired_at: Date | null;
  last_played_at: Date | null;
  play_count: number;
};

export function mapTrackRow(row: TrackRow): Track {
  return {
    id: row.id,
    canonicalKey: row.canonical_key,
    title: row.title,
    artistId: row.artist_id,
    artistName: row.artist_name,
    albumId: row.album_id ?? undefined,
    albumName: row.album_name ?? undefined,
    artworkUrl: row.artwork_url ?? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85',
    previewUrl: row.preview_url ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    durationSeconds: Number(row.duration_seconds ?? 0),
    genre: row.genre ?? undefined,
    year: row.year ?? undefined,
    tempo: row.tempo == null ? undefined : Number(row.tempo),
    mood: row.mood ?? undefined,
    energy: row.energy == null ? undefined : Number(row.energy),
    isLocal: row.is_local,
    localPath: row.local_path ?? undefined,
    isLiked: row.is_liked,
    isSaved: row.is_saved,
    isProtected: row.is_protected,
    acquiredAt: row.acquired_at?.toISOString(),
    lastPlayedAt: row.last_played_at?.toISOString(),
    playCount: Number(row.play_count ?? 0),
    source: row.is_local ? 'local' : 'deezer'
  };
}

export const trackColumns = `id, canonical_key, title, artist_id, artist_name, album_id, album_name, artwork_url, preview_url, source_url, duration_seconds, genre, year, tempo, mood, energy, is_local, local_path, is_liked, is_saved, is_protected, acquired_at, last_played_at, play_count`;

export async function searchStoredTracks(search: string, limit = 32) {
  const result = await query<TrackRow>(
    `SELECT ${trackColumns}
     FROM tracks
     WHERE title ILIKE $1 OR artist_name ILIKE $1 OR coalesce(album_name, '') ILIKE $1
     ORDER BY is_local DESC, last_played_at DESC NULLS LAST, title
     LIMIT $2`,
    [`%${search}%`, limit]
  );
  return result.rows.map(mapTrackRow);
}

export async function listStoredTracks(limit = 80) {
  const result = await query<TrackRow>(
    `SELECT ${trackColumns} FROM tracks ORDER BY last_played_at DESC NULLS LAST, title LIMIT $1`,
    [limit]
  );
  return result.rows.map(mapTrackRow);
}

export async function getStoredTrackById(trackId: string) {
  const result = await query<TrackRow>(`SELECT ${trackColumns} FROM tracks WHERE id = $1`, [trackId]);
  return result.rows[0] ? mapTrackRow(result.rows[0]) : undefined;
}

export async function upsertCatalogTrack(track: Track) {
  await query(
    `INSERT INTO artists (id, name, image_url, genres, source)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url, genres = EXCLUDED.genres, updated_at = now()`,
    [track.artistId, track.artistName, track.artworkUrl, track.genre ? [track.genre] : [], track.source]
  );
  if (track.albumId) {
    await query(
      `INSERT INTO albums (id, title, artist_id, artist_name, artwork_url, release_year, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, artwork_url = EXCLUDED.artwork_url, release_year = EXCLUDED.release_year, updated_at = now()`,
      [track.albumId, track.albumName ?? 'Unknown album', track.artistId, track.artistName, track.artworkUrl, track.year ?? null, track.source]
    );
  }
  await query(
    `INSERT INTO tracks (id, canonical_key, title, artist_id, artist_name, album_id, album_name, artwork_url, preview_url, source_url, duration_seconds, genre, year, tempo, mood, energy, is_liked, is_saved, is_protected, play_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, artwork_url = EXCLUDED.artwork_url, preview_url = EXCLUDED.preview_url, source_url = EXCLUDED.source_url, updated_at = now()`,
    [track.id, track.canonicalKey, track.title, track.artistId, track.artistName, track.albumId ?? null, track.albumName ?? null, track.artworkUrl, track.previewUrl ?? null, track.sourceUrl ?? null, track.durationSeconds, track.genre ?? null, track.year ?? null, track.tempo ?? null, track.mood ?? null, track.energy ?? null, track.isLiked, track.isSaved, track.isProtected, track.playCount]
  );
}

export async function setTrackLike(trackId: string, liked: boolean) {
  return withTransaction(async (client) => {
    const result = await client.query<TrackRow>(
      `UPDATE tracks SET is_liked = $2, is_protected = is_protected OR $2, updated_at = now() WHERE id = $1 RETURNING ${trackColumns}`,
      [trackId, liked]
    );
    if (!result.rows[0]) return undefined;
    if (liked) {
      await client.query(
        `INSERT INTO playlist_tracks (playlist_id, track_id, position)
         VALUES ('liked', $1, (SELECT coalesce(max(position), -1) + 1 FROM playlist_tracks WHERE playlist_id = 'liked'))
         ON CONFLICT (playlist_id, track_id) DO NOTHING`,
        [trackId]
      );
    } else {
      await client.query(`DELETE FROM playlist_tracks WHERE playlist_id = 'liked' AND track_id = $1`, [trackId]);
    }
    return mapTrackRow(result.rows[0]);
  });
}

export async function setTrackSaved(trackId: string, saved: boolean) {
  const result = await query<TrackRow>(
    `UPDATE tracks SET is_saved = $2, is_protected = is_protected OR $2, updated_at = now() WHERE id = $1 RETURNING ${trackColumns}`,
    [trackId, saved]
  );
  if (!result.rows[0]) return undefined;
  return mapTrackRow(result.rows[0]);
}

export async function recordTrackPlay(trackId: string) {
  await query(`UPDATE tracks SET play_count = play_count + 1, last_played_at = now(), updated_at = now() WHERE id = $1`, [trackId]);
}

export async function markTrackLocal(trackId: string, localPath: string) {
  const result = await query<TrackRow>(
    `UPDATE tracks SET is_local = true, local_path = $2, acquired_at = coalesce(acquired_at, now()), updated_at = now() WHERE id = $1 RETURNING ${trackColumns}`,
    [trackId, localPath]
  );
  return result.rows[0] ? mapTrackRow(result.rows[0]) : undefined;
}
