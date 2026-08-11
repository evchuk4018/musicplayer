import { getRecommendations } from '@/server/recommendation/recommendation-service';
import { findDemoTrack } from '@/lib/demo-data';
import { getStoredTrackById } from '@/server/catalog/catalog-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const context = searchParams.get('context');
  const seedId = searchParams.get('seed');
  const seed = seedId ? findDemoTrack(seedId) ?? (process.env.DATABASE_URL ? await getStoredTrackById(seedId).catch(() => undefined) : undefined) : undefined;
  const recommendations = await getRecommendations(context === 'track-radio' || context === 'artist-radio' ? context : 'home', seed);
  return Response.json({ tracks: recommendations });
}
