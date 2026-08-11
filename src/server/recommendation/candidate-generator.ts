import type { Track } from '@/domain/music';
import { listStoredTracks } from '@/server/catalog/catalog-repository';
import { databaseConfigured } from '@/server/db/client';
import { globalCandidatePool, relatedArtistsFor } from './relationship-graph';

export async function generateCandidates(seed?: Track) {
  const base = globalCandidatePool(seed);
  let stored: Track[] = [];
  if (databaseConfigured()) {
    try {
      stored = await listStoredTracks(100);
    } catch {
      stored = [];
    }
  }
  const relationships = seed ? await relatedArtistsFor(seed) : [];
  const relatedIds = new Set(relationships.map((item) => item.artistId));
  const candidates = [...stored, ...base].filter((track) => track.id !== seed?.id);
  return {
    candidates: Array.from(new Map(candidates.map((track) => [track.canonicalKey, track])).values()).slice(0, 100),
    relationships
  };
}
