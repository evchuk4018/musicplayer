import type { Artist, Track } from '@/domain/music';
import { DEMO_ARTISTS, DEMO_TRACKS } from '@/lib/demo-data';
import { getCatalogProvider } from '@/server/catalog/provider';

export type ArtistRelationship = { artistId: string; score: number; reason: string };

export async function relatedArtistsFor(seed: Track | Artist): Promise<ArtistRelationship[]> {
  const seedArtistId = 'artistId' in seed ? seed.artistId : seed.id;
  const demoArtist = DEMO_ARTISTS.find((artist) => artist.id === seedArtistId || artist.id === seed.id);
  const localRelationships = demoArtist?.similarArtistIds.map((artistId, index) => ({ artistId, score: 1 - index * 0.15, reason: 'shared public music relationships' })) ?? [];
  if (seed.source === 'deezer') {
    try {
      const related = await getCatalogProvider().getRelatedArtists?.(seedArtistId);
      return [...localRelationships, ...(related ?? []).map((artist, index) => ({ artistId: artist.id, score: Math.max(0.45, 0.92 - index * 0.02), reason: 'external related-artist graph' }))];
    } catch {
      return localRelationships;
    }
  }
  return localRelationships;
}

export function trackRelationshipScore(seed: Track | undefined, candidate: Track, relationships: ArtistRelationship[]) {
  if (!seed) return 0.35;
  if (candidate.artistId === seed.artistId) return 0.92;
  if (candidate.genre && seed.genre && candidate.genre === seed.genre) return 0.7;
  if (candidate.mood && seed.mood && candidate.mood === seed.mood) return 0.65;
  const relationship = relationships.find((item) => item.artistId === candidate.artistId);
  if (relationship) return relationship.score;
  if (candidate.tempo && seed.tempo) {
    const distance = Math.min(1, Math.abs(candidate.tempo - seed.tempo) / 80);
    return 0.45 - distance * 0.2;
  }
  return 0.28;
}

export function globalCandidatePool(seed?: Track) {
  const pool = DEMO_TRACKS.filter((track) => track.id !== seed?.id);
  return pool.slice(0, 100);
}
