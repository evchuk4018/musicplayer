import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const art = {
  night: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85',
  blue: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85',
  orange: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85',
  pink: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85'
};
const audio = 'https://storage.googleapis.com/coverr-main/mp3/Mt_Baker.mp3';
const tracks = [
  ['demo:track:after-hours', 'After Hours', 'demo:midnight', 'Midnight Radio', 'demo:album:afterglow', 'Afterglow FM', art.night, 'indie electronic', 214, true, false],
  ['demo:track:low-light', 'Low Light', 'demo:midnight', 'Midnight Radio', 'demo:album:afterglow', 'Afterglow FM', art.night, 'downtempo', 198, true, true],
  ['demo:track:soft-focus', 'Soft Focus', 'demo:cloudyfield', 'cloudyfield', 'demo:album:soft-focus', 'Soft Focus', art.blue, 'dream pop', 187, false, false],
  ['demo:track:blue-hour', 'Blue Hour', 'demo:cloudyfield', 'cloudyfield', 'demo:album:soft-focus', 'Soft Focus', art.blue, 'alt pop', 226, true, false],
  ['demo:track:somewhere-warm', 'Somewhere Warm', 'demo:golden', 'Golden Hour', 'demo:album:rooms', 'Rooms With The Lights Low', art.orange, 'neo soul', 203, false, true],
  ['demo:track:open-window', 'Open Window', 'demo:golden', 'Golden Hour', 'demo:album:rooms', 'Rooms With The Lights Low', art.orange, 'r&b', 239, false, false],
  ['demo:track:run-it-back', 'Run It Back', 'demo:neon', 'Neon Atlas', 'demo:album:motion', 'Motion Studies', art.pink, 'hip-hop', 192, true, false],
  ['demo:track:velvet-rope', 'Velvet Rope', 'demo:velvet', 'Velvet Weekend', 'demo:album:weekend', 'Velvet Weekend', art.pink, 'house', 206, false, false]
];

try {
  for (const [id, title, artistId, artistName, albumId, albumName, artworkUrl, genre, duration, local, liked] of tracks) {
    const canonicalKey = `${String(artistName).toLowerCase()}::${String(title).toLowerCase()}`;
    await pool.query(`INSERT INTO artists (id, name, image_url, genres, source) VALUES ($1, $2, $3, $4, 'demo') ON CONFLICT (id) DO NOTHING`, [artistId, artistName, artworkUrl, [genre]]);
    await pool.query(`INSERT INTO albums (id, title, artist_id, artist_name, artwork_url, release_year, source) VALUES ($1, $2, $3, $4, $5, 2025, 'demo') ON CONFLICT (id) DO NOTHING`, [albumId, albumName, artistId, artistName, artworkUrl]);
    await pool.query(`INSERT INTO tracks (id, canonical_key, title, artist_id, artist_name, album_id, album_name, artwork_url, preview_url, duration_seconds, genre, is_local, is_liked, is_saved, is_protected) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, $13) ON CONFLICT (id) DO NOTHING`, [id, canonicalKey, title, artistId, artistName, albumId, albumName, artworkUrl, audio, duration, genre, local, liked]);
  }
  const playlists = [
    ['playlist:late-night', 'Late Night', 'Soft lights, low volume', art.night, false, false, 1, ['demo:track:after-hours', 'demo:track:low-light']],
    ['playlist:focus', 'Deep Focus', 'A steady room to work in', art.blue, false, false, 2, ['demo:track:soft-focus', 'demo:track:blue-hour', 'demo:track:run-it-back']],
    ['playlist:weekend', 'Weekend Energy', 'Start somewhere warm', art.pink, false, false, 3, ['demo:track:somewhere-warm', 'demo:track:velvet-rope']]
  ];
  for (const [id, name, description, artworkUrl, isSystem, isProtected, position, trackIds] of playlists) {
    await pool.query(`INSERT INTO playlists (id, user_id, name, description, artwork_url, is_system, is_protected, position) VALUES ($1, 'default', $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, artwork_url = EXCLUDED.artwork_url, position = EXCLUDED.position`, [id, name, description, artworkUrl, isSystem, isProtected, position]);
    for (const [trackPosition, trackId] of trackIds.entries()) await pool.query(`INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [id, trackId, trackPosition]);
    await pool.query(`INSERT INTO quick_dial_items (user_id, playlist_id, position) VALUES ('default', $1, $2) ON CONFLICT (user_id, playlist_id) DO UPDATE SET position = EXCLUDED.position`, [id, position - 1]);
  }
  console.log(`Seeded ${tracks.length} tracks and ${playlists.length} playlists`);
} finally {
  await pool.end();
}
