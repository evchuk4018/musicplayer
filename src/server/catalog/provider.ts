import { DeezerCatalogProvider } from './deezer-provider';
import type { CatalogProvider } from './types';

export function getCatalogProvider(): CatalogProvider {
  switch (process.env.MUSIC_CATALOG_PROVIDER ?? 'deezer') {
    case 'deezer':
    default:
      return new DeezerCatalogProvider();
  }
}
