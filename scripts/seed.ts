import { DEMO_PLAYLISTS, DEMO_TRACKS } from '../src/lib/demo-data';
import { query, closeDatabase } from '../src/server/db/client';
import { upsertCatalogTrack } from '../src/server/catalog/catalog-repository';

async function main() {
  for (const track of DEMO_TRACKS) await upsertCatalogTrack(track);
  for (const playlist of DEMO_PLAYLISTS) {
    await query(`INSERT INTO playlists (id, user_id, name, description, artwork_url, is_system, is_protected, position) VALUES ($1, 'default', $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, artwork_url = EXCLUDED.artwork_url, position = EXCLUDED.position`, [playlist.id, playlist.name, playlist.description ?? null, playlist.artworkUrl, playlist.isSystem, playlist.isProtected, playlist.position]);
    for (const [position, track] of playlist.tracks.entries()) {
      await query(`INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3) ON CONFLICT (playlist_id, track_id) DO UPDATE SET position = EXCLUDED.position`, [playlist.id, track.id, position]);
    }
  }
  for (const [position, playlist] of DEMO_APP_QUICK_DIAL.entries()) {
    await query(`INSERT INTO quick_dial_items (user_id, playlist_id, position) VALUES ('default', $1, $2) ON CONFLICT (user_id, playlist_id) DO UPDATE SET position = EXCLUDED.position`, [playlist.id, position]);
  }
  console.log(`Seeded ${DEMO_TRACKS.length} tracks and ${DEMO_PLAYLISTS.length} playlists`);
}

const DEMO_APP_QUICK_DIAL = DEMO_PLAYLISTS.filter((playlist) => playlist.id !== 'liked').slice(0, 3);

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDatabase());
