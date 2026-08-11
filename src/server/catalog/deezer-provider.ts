import type { Album, Artist, Track } from '@/domain/music';
import type { CatalogProvider, CatalogSearch } from './types';

type DeezerTrack = {
  id: number;
  title: string;
  duration: number;
  preview?: string;
  link?: string;
  artist: { id: number; name: string; picture_medium?: string; picture_big?: string };
  album: { id: number; title: string; cover_medium?: string; cover_big?: string; release_date?: string };
};

type DeezerSearchResponse = { data?: DeezerTrack[] };

function imageFor(value?: string) {
  return value ?? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85';
}

function mapTrack(item: DeezerTrack): Track {
  const artistId = `deezer:artist:${item.artist.id}`;
  const albumId = `deezer:album:${item.album.id}`;
  return {
    id: `deezer:track:${item.id}`,
    canonicalKey: `${item.artist.name.toLowerCase()}::${item.title.toLowerCase()}`,
    title: item.title,
    artistId,
    artistName: item.artist.name,
    albumId,
    albumName: item.album.title,
    artworkUrl: imageFor(item.album.cover_big ?? item.album.cover_medium ?? item.artist.picture_big ?? item.artist.picture_medium),
    previewUrl: item.preview,
    sourceUrl: item.link,
    durationSeconds: item.duration,
    year: item.album.release_date ? Number(item.album.release_date.slice(0, 4)) : undefined,
    isLocal: false,
    isLiked: false,
    isSaved: false,
    isProtected: false,
    playCount: 0,
    source: 'deezer'
  };
}

export class DeezerCatalogProvider implements CatalogProvider {
  readonly name = 'deezer';

  async search(query: string): Promise<CatalogSearch> {
    const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=24`, {
      headers: { accept: 'application/json' },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Deezer search failed with ${response.status}`);
    }

    const payload = (await response.json()) as DeezerSearchResponse;
    const tracks = (payload.data ?? []).map(mapTrack);
    const artists = Array.from(new Map(tracks.map((track) => [track.artistId, {
      id: track.artistId,
      name: track.artistName,
      imageUrl: track.artworkUrl,
      genres: [],
      similarArtistIds: [],
      source: 'deezer' as const
    }])).values()).slice(0, 8);
    const albums = Array.from(new Map(tracks.filter((track) => track.albumId).map((track) => [track.albumId, {
      id: track.albumId!,
      title: track.albumName ?? 'Unknown album',
      artistId: track.artistId,
      artistName: track.artistName,
      artworkUrl: track.artworkUrl,
      releaseYear: track.year,
      tracks: tracks.filter((candidate) => candidate.albumId === track.albumId),
      source: 'deezer' as const
    }])).values()).slice(0, 8);

    return { query, tracks, artists, albums };
  }

  async getArtist(artistId: string): Promise<Artist | undefined> {
    const id = artistId.split(':').at(-1);
    if (!id) return undefined;
    const response = await fetch(`https://api.deezer.com/artist/${id}`, { next: { revalidate: 3600 } });
    if (!response.ok) return undefined;
    const payload = await response.json() as { id: number; name: string; picture_big?: string; picture_medium?: string };
    return { id: artistId, name: payload.name, imageUrl: imageFor(payload.picture_big ?? payload.picture_medium), genres: [], similarArtistIds: [], source: 'deezer' };
  }

  async getAlbum(albumId: string): Promise<Album | undefined> {
    const id = albumId.split(':').at(-1);
    if (!id) return undefined;
    const response = await fetch(`https://api.deezer.com/album/${id}`, { next: { revalidate: 3600 } });
    if (!response.ok) return undefined;
    const payload = await response.json() as { id: number; title: string; cover_big?: string; cover_medium?: string; release_date?: string; artist: { id: number; name: string }; tracks?: { data?: DeezerTrack[] } };
    return {
      id: albumId,
      title: payload.title,
      artistId: `deezer:artist:${payload.artist.id}`,
      artistName: payload.artist.name,
      artworkUrl: imageFor(payload.cover_big ?? payload.cover_medium),
      releaseYear: payload.release_date ? Number(payload.release_date.slice(0, 4)) : undefined,
      tracks: (payload.tracks?.data ?? []).map(mapTrack),
      source: 'deezer'
    };
  }

  async getRelatedArtists(artistId: string): Promise<Artist[]> {
    const id = artistId.split(':').at(-1);
    if (!id) return [];
    const response = await fetch(`https://api.deezer.com/artist/${id}/related?limit=20`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const payload = await response.json() as { data?: Array<{ id: number; name: string; picture_medium?: string; picture_big?: string }> };
    return (payload.data ?? []).map((artist) => ({
      id: `deezer:artist:${artist.id}`,
      name: artist.name,
      imageUrl: imageFor(artist.picture_big ?? artist.picture_medium),
      genres: [],
      similarArtistIds: [],
      source: 'deezer' as const
    }));
  }
}
