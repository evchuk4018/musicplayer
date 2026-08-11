import { DEMO_ALBUMS, DEMO_ARTISTS, DEMO_TRACKS } from '@/lib/demo-data';
import type { Album, Artist, Track } from '@/domain/music';
import { getCatalogProvider } from './provider';
import type { ArtistCatalog } from './types';

export async function getArtistCatalog(artistId: string): Promise<ArtistCatalog | undefined> {
  const demoArtist = DEMO_ARTISTS.find((artist) => artist.id === artistId);
  if (demoArtist) return { artist: demoArtist, tracks: DEMO_TRACKS.filter((track) => track.artistId === artistId), albums: DEMO_ALBUMS.filter((album) => album.artistId === artistId) };
  return getCatalogProvider().getArtistCatalog?.(artistId);
}

export async function getAlbumCatalog(albumId: string): Promise<Album | undefined> {
  const demoAlbum = DEMO_ALBUMS.find((album) => album.id === albumId);
  if (demoAlbum) return demoAlbum;
  return getCatalogProvider().getAlbum?.(albumId);
}

export type CatalogDetail = { kind: 'artist'; artist: Artist; tracks: Track[]; albums: Album[] } | { kind: 'album'; album: Album };
