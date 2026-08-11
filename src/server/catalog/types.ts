import type { Album, Artist, Track } from '@/domain/music';

export type CatalogSearch = {
  query: string;
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
};

export interface CatalogProvider {
  readonly name: string;
  search(query: string): Promise<CatalogSearch>;
  getArtist?(artistId: string): Promise<Artist | undefined>;
  getAlbum?(albumId: string): Promise<Album | undefined>;
  getRelatedArtists?(artistId: string): Promise<Artist[]>;
}
