import { DEMO_ALBUMS, DEMO_ARTISTS, DEMO_TRACKS } from '@/lib/demo-data';
import type { Album, Artist, SearchResults, Track } from '@/domain/music';
import { databaseConfigured } from '@/server/db/client';
import { listStoredTracks, searchStoredTracks, upsertCatalogTrack } from './catalog-repository';
import { getCatalogProvider } from './provider';

function uniqueTracks(tracks: Track[]) {
  return Array.from(new Map(tracks.map((track) => [track.canonicalKey, track])).values());
}

function uniqueArtists(artists: Artist[]) {
  return Array.from(new Map(artists.map((artist) => [artist.id, artist])).values());
}

function uniqueAlbums(albums: Album[]) {
  return Array.from(new Map(albums.map((album) => [album.id, album])).values());
}

export async function searchCatalog(search: string): Promise<SearchResults> {
  const queryText = search.trim();
  const demoTracks = queryText
    ? DEMO_TRACKS.filter((track) => `${track.title} ${track.artistName} ${track.albumName ?? ''}`.toLowerCase().includes(queryText.toLowerCase()))
    : DEMO_TRACKS;
  const demoArtists = queryText
    ? DEMO_ARTISTS.filter((artist) => artist.name.toLowerCase().includes(queryText.toLowerCase()))
    : DEMO_ARTISTS;
  const demoAlbums = queryText
    ? DEMO_ALBUMS.filter((album) => `${album.title} ${album.artistName}`.toLowerCase().includes(queryText.toLowerCase()))
    : DEMO_ALBUMS;

  let storedTracks: Track[] = [];
  if (databaseConfigured()) {
    try {
      storedTracks = queryText ? await searchStoredTracks(queryText) : await listStoredTracks();
    } catch {
      storedTracks = [];
    }
  }

  let external = { tracks: [] as Track[], artists: [] as Artist[], albums: [] as Album[], playlists: [] as import('@/domain/music').Playlist[] };
  if (queryText && process.env.MUSIC_CATALOG_PROVIDER !== 'demo') {
    try {
      external = await getCatalogProvider().search(queryText);
      if (databaseConfigured()) {
        await Promise.all(external.tracks.slice(0, 24).map((track) => upsertCatalogTrack(track).catch(() => undefined)));
      }
    } catch {
      external = { tracks: [], artists: [], albums: [], playlists: [] };
    }
  }

  return {
    query: queryText,
    tracks: uniqueTracks([...storedTracks, ...external.tracks, ...demoTracks]).slice(0, 40),
    artists: uniqueArtists([...external.artists, ...demoArtists]).slice(0, 12),
    albums: uniqueAlbums([...external.albums, ...demoAlbums]).slice(0, 12),
    playlists: Array.from(new Map(external.playlists.map((playlist) => [playlist.id, playlist])).values()).slice(0, 8)
  };
}

export async function persistTrackIfConfigured(track: Track) {
  if (databaseConfigured()) {
    try {
      await upsertCatalogTrack(track);
    } catch {
      // A catalog result remains playable from its provider preview if persistence is unavailable.
    }
  }
}
