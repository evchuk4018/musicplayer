import type { QueryResultRow } from 'pg';
import type { LibrarySnapshot, Playlist, Track } from '@/domain/music';
import { query, withTransaction } from '@/server/db/client';
import { mapTrackRow } from '@/server/catalog/catalog-repository';

type PlaylistRow = QueryResultRow & {
  id: string;
  name: string;
  description: string | null;
  artwork_url: string | null;
  is_system: boolean;
  is_protected: boolean;
  position: number;
};

type PlaylistTrackRow = QueryResultRow & {
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

const playlistColumns = 'id, name, description, artwork_url, is_system, is_protected, position';

function mapPlaylist(row: PlaylistRow, tracks: Track[]): Playlist {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    artworkUrl: row.artwork_url ?? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85',
    isSystem: row.is_system,
    isProtected: row.is_protected,
    position: row.position,
    trackCount: tracks.length,
    tracks
  };
}

async function tracksForPlaylist(playlistId: string) {
  const result = await query<PlaylistTrackRow>(
    `SELECT t.id, t.canonical_key, t.title, t.artist_id, t.artist_name, t.album_id, t.album_name, t.artwork_url, t.preview_url, t.source_url, t.duration_seconds, t.genre, t.year, t.tempo, t.mood, t.energy, t.is_local, t.local_path, t.is_liked, t.is_saved, t.is_protected, t.acquired_at, t.last_played_at, t.play_count
     FROM playlist_tracks pt JOIN tracks t ON t.id = pt.track_id
     WHERE pt.playlist_id = $1 ORDER BY pt.position, pt.added_at`,
    [playlistId]
  );
  return result.rows.map(mapTrackRow);
}

export async function listPlaylists(includeSystem = true) {
  const result = await query<PlaylistRow>(
    `SELECT ${playlistColumns} FROM playlists WHERE user_id = 'default' ${includeSystem ? '' : 'AND is_system = false'} ORDER BY position, created_at`
  );
  return Promise.all(result.rows.map(async (row) => mapPlaylist(row, await tracksForPlaylist(row.id))));
}

export async function getLibrarySnapshot(): Promise<LibrarySnapshot> {
  const [allPlaylists, recentResult, savedResult, quickDialResult, searchesResult] = await Promise.all([
    listPlaylists(true),
    query<PlaylistTrackRow>(`SELECT t.id, t.canonical_key, t.title, t.artist_id, t.artist_name, t.album_id, t.album_name, t.artwork_url, t.preview_url, t.source_url, t.duration_seconds, t.genre, t.year, t.tempo, t.mood, t.energy, t.is_local, t.local_path, t.is_liked, t.is_saved, t.is_protected, t.acquired_at, t.last_played_at, t.play_count FROM tracks t WHERE t.last_played_at IS NOT NULL ORDER BY t.last_played_at DESC LIMIT 12`),
    query<PlaylistTrackRow>(`SELECT t.id, t.canonical_key, t.title, t.artist_id, t.artist_name, t.album_id, t.album_name, t.artwork_url, t.preview_url, t.source_url, t.duration_seconds, t.genre, t.year, t.tempo, t.mood, t.energy, t.is_local, t.local_path, t.is_liked, t.is_saved, t.is_protected, t.acquired_at, t.last_played_at, t.play_count FROM tracks t WHERE t.is_saved = true ORDER BY t.last_played_at DESC NULLS LAST, t.title LIMIT 40`),
    query<PlaylistRow>(`SELECT p.${playlistColumns.replaceAll(', ', ', p.')} FROM quick_dial_items q JOIN playlists p ON p.id = q.playlist_id WHERE q.user_id = 'default' ORDER BY q.position`),
    query<QueryResultRow & { query: string }>(`SELECT query FROM recent_searches WHERE user_id = 'default' ORDER BY last_used_at DESC LIMIT 8`)
  ]);
  const likedPlaylist = allPlaylists.find((playlist) => playlist.id === 'liked') ?? {
    id: 'liked', name: 'Liked Music', description: 'Your one-tap favorites', artworkUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85', isSystem: true, isProtected: true, position: 0, trackCount: 0, tracks: []
  };
  return {
    playlists: allPlaylists.filter((playlist) => playlist.id !== 'liked'),
    likedPlaylist,
    recentlyPlayed: recentResult.rows.map(mapTrackRow),
    savedTracks: savedResult.rows.map(mapTrackRow),
    recentSearches: searchesResult.rows.map((row) => row.query),
    quickDial: await Promise.all(quickDialResult.rows.map(async (row) => mapPlaylist(row, await tracksForPlaylist(row.id))))
  };
}

export async function createPlaylist(name: string, description?: string, artworkUrl?: string) {
  const id = `playlist:${crypto.randomUUID()}`;
  const result = await query<PlaylistRow>(
    `INSERT INTO playlists (id, user_id, name, description, artwork_url, position)
     VALUES ($1, 'default', $2, $3, $4, (SELECT coalesce(max(position), 0) + 1 FROM playlists WHERE user_id = 'default'))
     RETURNING ${playlistColumns}`,
    [id, name, description ?? null, artworkUrl ?? null]
  );
  return mapPlaylist(result.rows[0], []);
}

export async function updatePlaylist(playlistId: string, input: { name?: string; description?: string; artworkUrl?: string }) {
  const result = await query<PlaylistRow>(
    `UPDATE playlists SET name = coalesce($2, name), description = coalesce($3, description), artwork_url = coalesce($4, artwork_url), updated_at = now()
     WHERE id = $1 RETURNING ${playlistColumns}`,
    [playlistId, input.name ?? null, input.description ?? null, input.artworkUrl ?? null]
  );
  if (!result.rows[0]) return undefined;
  return mapPlaylist(result.rows[0], await tracksForPlaylist(playlistId));
}

export async function deletePlaylist(playlistId: string) {
  await query(`DELETE FROM playlists WHERE id = $1 AND is_system = false`, [playlistId]);
}

export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  await query(
    `INSERT INTO playlist_tracks (playlist_id, track_id, position)
     VALUES ($1, $2, (SELECT coalesce(max(position), -1) + 1 FROM playlist_tracks WHERE playlist_id = $1))
     ON CONFLICT (playlist_id, track_id) DO NOTHING`,
    [playlistId, trackId]
  );
  await query(`UPDATE tracks SET is_protected = true WHERE id = $1`, [trackId]);
  return tracksForPlaylist(playlistId);
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  await query(`DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2`, [playlistId, trackId]);
  return tracksForPlaylist(playlistId);
}

export async function reorderPlaylistTracks(playlistId: string, trackIds: string[]) {
  await withTransaction(async (client) => {
    for (const [position, trackId] of trackIds.entries()) {
      await client.query(`UPDATE playlist_tracks SET position = $3 WHERE playlist_id = $1 AND track_id = $2`, [playlistId, trackId, position]);
    }
  });
  return tracksForPlaylist(playlistId);
}

export async function toggleQuickDial(playlistId: string, enabled: boolean) {
  if (enabled) {
    await query(`INSERT INTO quick_dial_items (user_id, playlist_id, position) VALUES ('default', $1, (SELECT coalesce(max(position), -1) + 1 FROM quick_dial_items WHERE user_id = 'default')) ON CONFLICT DO NOTHING`, [playlistId]);
  } else {
    await query(`DELETE FROM quick_dial_items WHERE user_id = 'default' AND playlist_id = $1`, [playlistId]);
  }
  return getLibrarySnapshot();
}

export async function reorderQuickDial(playlistIds: string[]) {
  await withTransaction(async (client) => {
    for (const [position, playlistId] of playlistIds.entries()) {
      await client.query(`UPDATE quick_dial_items SET position = $2 WHERE user_id = 'default' AND playlist_id = $1`, [playlistId, position]);
    }
  });
  return getLibrarySnapshot();
}

export async function recordSearch(search: string) {
  await query(`INSERT INTO recent_searches (user_id, query) VALUES ('default', $1) ON CONFLICT (user_id, query) DO UPDATE SET last_used_at = now()`, [search]);
}

export async function recordListeningEvent(input: { id: string; trackId: string; eventType: string; positionSeconds?: number; completionPercent?: number; context?: string; metadata?: Record<string, unknown> }) {
  await query(`INSERT INTO listening_events (id, user_id, track_id, event_type, position_seconds, completion_percent, context, metadata) VALUES ($1, 'default', $2, $3, $4, $5, $6, $7)`, [input.id, input.trackId, input.eventType, input.positionSeconds ?? null, input.completionPercent ?? null, input.context ?? null, JSON.stringify(input.metadata ?? {})]);
}

export async function getRecentListeningEvents(limit = 250) {
  return query<QueryResultRow & { track_id: string; event_type: string; completion_percent: number | null; position_seconds: number | null; occurred_at: Date }>(`SELECT track_id, event_type, completion_percent, position_seconds, occurred_at FROM listening_events WHERE user_id = 'default' ORDER BY occurred_at DESC LIMIT $1`, [limit]);
}
