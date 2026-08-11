import pg from 'pg';

// One-time operator seed for the songs supplied in the user's liked-music screenshots.
// This script is intentionally not called by deploy-homelab.sh or the recurring demo seed.

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const previewUrl = 'https://storage.googleapis.com/coverr-main/mp3/Mt_Baker.mp3';
const artworkUrls = [
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85'
];

const songs = [
  { title: 'MY JEALOUSY (Super Slowed)', artist: 'vivi baby & ovg!', durationSeconds: 187, genre: 'pop' },
  { title: 'LET THE WORLD BURN (TikTok Guitar Cover x Hoodtrap Mashup)', artist: 'R3BEL, Joshua Guitar, & Kryd', genre: 'pop' },
  { title: 'But Peter youre going to die', artist: 'Zizzle', durationSeconds: 123, genre: 'alternative' },
  { title: "But... Peter u, are goin' to die...", artist: 'itgmqprod', durationSeconds: 124, genre: 'alternative' },
  { title: 'Freaks', artist: 'Surf Curse', durationSeconds: 148, genre: 'indie' },
  { title: 'Creep', artist: 'Radiohead', durationSeconds: 239, genre: 'alternative' },
  { title: 'Where Is My Mind?', artist: 'Pixies', genre: 'alternative' },
  { title: 'Never Say Goodbye', artist: 'ThnxCya', durationSeconds: 199, genre: 'pop' },
  { title: 'do it all for me', artist: 'cloudyfield', durationSeconds: 140, genre: 'dream pop' },
  { title: 'Dark Horse (Hoodtrap / Mylancore) SLOWED', artist: 'Kryd', durationSeconds: 114, genre: 'hip-hop' },
  { title: 'Dark Horse (Hardstyle)', artist: 'BAKI, ZYZZ, & GYM HARDSTYLE', genre: 'hardstyle' },
  { title: 'Impostor Syndrome', artist: 'Sidney Gish', durationSeconds: 295, genre: 'indie' },
  { title: 'Euphoria (Guitar Remix) - Kendrick Lamar x DinoA1', artist: 'DinoA1', durationSeconds: 333, genre: 'hip-hop' },
  { title: 'Only Place To Go From F...', artist: 'A50mic', durationSeconds: 109, genre: 'hip-hop' },
  { title: 'The Love I Lost', artist: 'Fried By Fluoride', durationSeconds: 113, genre: 'alternative' },
  { title: 'Lil Crush', artist: 'VIOLENT VIRA', durationSeconds: 182, genre: 'alternative' },
  { title: 'Wave In The Monitor', artist: 'VIOLENT VIRA', durationSeconds: 224, genre: 'alternative' },
  { title: 'Burn Me With A Bible', artist: 'VIOLENT VIRA', durationSeconds: 246, genre: 'alternative' },
  { title: "I Don't Care Nightcore", artist: 'Violent Vira', durationSeconds: 153, genre: 'alternative' },
  { title: 'Dream Boy', artist: 'Beach Bunny', durationSeconds: 142, genre: 'indie' },
  { title: 'Sports', artist: 'Beach Bunny', genre: 'indie' },
  { title: 'Alone again', artist: 'aslov!', durationSeconds: 289, genre: 'alternative' },
  { title: 'WHY DID YOU MAKE ME DO THIS? (Official Music Video)', artist: 'Muller', durationSeconds: 162, genre: 'alternative' },
  { title: 'For You', artist: 'TV Girl', durationSeconds: 216, genre: 'indie pop' },
  { title: 'crawl', artist: 'cloudyfield', durationSeconds: 201, genre: 'dream pop' },
  { title: 'in your head', artist: 'cloudyfield', durationSeconds: 170, genre: 'dream pop' },
  { title: 'Tom Tom', artist: 'Holy Fuck', durationSeconds: 228, genre: 'electronic' },
  { title: 'Earrings', artist: 'Malcolm Todd', genre: 'alternative' },
  { title: 'FREE PICK', artist: 'Offset', durationSeconds: 89, genre: 'hip-hop' },
  { title: 'WE ON GO', artist: 'BIA', durationSeconds: 169, genre: 'hip-hop' },
  { title: 'so so brooks - Tragic Freestyle 2 ft. Dj Ess (slowed & edited to per...', artist: 'xu', durationSeconds: 108, genre: 'hip-hop' },
  { title: 'Hello Juliet', artist: 'Clarion', durationSeconds: 208, genre: 'pop' },
  { title: 'Young(slowed) x jesse pinkman', artist: 'Grabniks', durationSeconds: 220, genre: 'alternative' },
  { title: 'Jane! -The Long Faces [Amv] Spider Man Gwen Stacy Event Edit', artist: 'Dante Natsuki', durationSeconds: 132, genre: 'electronic' },
  { title: 'Dazey and the Scouts song Wet x silent voice intro kitchen scene', artist: 'Eli!!', durationSeconds: 169, genre: 'alternative' },
  { title: 'the perfect pair- beabadobee (slowed) [why would you wanna...', artist: 'will!', durationSeconds: 249, genre: 'indie pop' },
  { title: "I Can't Handle Change", artist: 'ROAR', durationSeconds: 199, genre: 'indie' },
  { title: 'Wet', artist: 'Dazey and the Scouts', durationSeconds: 172, genre: 'punk' },
  { title: 'Gucci Flip Flops x Careless Whisper - Slowed + Reverb + Lo...', artist: 'Moonshine', durationSeconds: 175, genre: 'hip-hop' },
  { title: 'Gucci Flip Flops x Careless Whisper', artist: 'Moonshine', durationSeconds: 203, genre: 'hip-hop' },
  { title: "Johnny P's Caddy", artist: 'Benny The Butcher & J. Cole', genre: 'hip-hop' },
  { title: '5 to 50 (feat. India)', artist: 'Benny the Butcher', durationSeconds: 233, genre: 'hip-hop' },
  { title: 'Step On Me', artist: 'The Cardigans', durationSeconds: 231, genre: 'alternative' },
  { title: 'LEGACY (slowed down) (feat. PIXXY)', artist: 'backfromparadise', durationSeconds: 162, genre: 'electronic' },
  { title: "i'm gonna tell my therapist on you", artist: 'Pinkshift', durationSeconds: 162, genre: 'punk' },
  { title: '"THE ONLY REASON I CONTINUE TO FIGHT IS BECAUSE I HAVE TO..."', artist: 'Knowelle', durationSeconds: 125, genre: 'electronic' },
  { title: 'MEANT TO BE (HARDSTYLE ULTRA SLOWED)', artist: 'prodArvee & svdst', durationSeconds: 173, genre: 'hardstyle' },
  { title: 'Like That', artist: 'Future, Metro Boomin, & Kendrick Lamar', genre: 'hip-hop' },
  { title: '[BEST ONE] Siinamota - Young Girl A [BREAKCORE EXTENDED REMIX]', artist: 'slattington', durationSeconds: 175, genre: 'breakcore' },
  { title: 'POV: VOCÊ NÃO PODE PARAR AGORA', artist: 'Pary!', durationSeconds: 126, genre: 'electronic' },
  { title: 'CUTE DEPRESSED', artist: 'Dyan Dxdddy', durationSeconds: 97, genre: 'electronic' },
  { title: 'Blue', artist: 'Mannequin Death Squad', durationSeconds: 168, genre: 'alternative' },
  { title: 'Black Sheep (Brie Larson Vocal Version) (feat. Brie Larson)', artist: 'Metric', durationSeconds: 295, genre: 'alternative' },
  { title: 'bedrott', artist: 'duskydemise', durationSeconds: 114, genre: 'electronic' },
  { title: "i didn't care anymore. (vegeta x yeat - talk.) (guitar remix)", artist: 'fwsatoru', durationSeconds: 196, genre: 'electronic' },
  { title: 'miss me - TREFUEGO (ig: ismokefuego)', artist: 'TREFUEGO', durationSeconds: 175, genre: 'hip-hop' },
  { title: 'The One That Got Away', artist: 'Katy Perry', durationSeconds: 228, genre: 'pop' },
  { title: '...Baby One More Time', artist: 'Britney Spears', durationSeconds: 212, genre: 'pop' },
  { title: 'Bubble Pop Electric', artist: 'Gwen Stefani', durationSeconds: 223, genre: 'pop' },
  { title: 'Mtg Girl a 2.0', artist: 'EmyyH & Vxndo', durationSeconds: 230, genre: 'electronic' },
  { title: 'Meant To Be', artist: 'Cuntsniffer', durationSeconds: 161, genre: 'electronic' }
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const likedPlaylist = await client.query("SELECT 1 FROM playlists WHERE id = 'liked'");
    if (!likedPlaylist.rowCount) throw new Error("The 'liked' playlist is missing; apply the database migrations first.");

    for (const [position, song] of songs.entries()) {
      const artistId = `oneoff:artist:${slug(song.artist)}`;
      const trackId = `oneoff:track:${slug(song.artist)}:${slug(song.title)}`;
      const canonicalKey = `${song.artist.toLowerCase()}::${song.title.toLowerCase()}`;
      const artworkUrl = artworkUrls[position % artworkUrls.length];

      await client.query(
        `INSERT INTO artists (id, name, image_url, genres, source)
         VALUES ($1, $2, $3, $4, 'demo')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url, genres = EXCLUDED.genres, updated_at = now()`,
        [artistId, song.artist, artworkUrl, [song.genre]]
      );

      const track = await client.query(
        `INSERT INTO tracks (id, canonical_key, title, artist_id, artist_name, artwork_url, preview_url, duration_seconds, genre, is_liked, is_protected)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, true)
         ON CONFLICT (canonical_key) DO UPDATE SET
           title = EXCLUDED.title,
           artist_id = EXCLUDED.artist_id,
           artist_name = EXCLUDED.artist_name,
           artwork_url = EXCLUDED.artwork_url,
           preview_url = EXCLUDED.preview_url,
           duration_seconds = EXCLUDED.duration_seconds,
           genre = EXCLUDED.genre,
           is_liked = true,
           is_protected = true,
           updated_at = now()
         RETURNING id`,
        [trackId, canonicalKey, song.title, artistId, song.artist, artworkUrl, previewUrl, song.durationSeconds ?? 0, song.genre]
      );

      await client.query(
        `INSERT INTO playlist_tracks (playlist_id, track_id, position)
         VALUES ('liked', $1, $2)
         ON CONFLICT (playlist_id, track_id) DO NOTHING`,
        [track.rows[0].id, position]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${songs.length} one-off liked songs`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
