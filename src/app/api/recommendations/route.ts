import { getRecommendations } from '@/server/recommendation/recommendation-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const context = searchParams.get('context');
  const recommendations = await getRecommendations(context === 'track-radio' || context === 'artist-radio' ? context : 'home');
  return Response.json({ tracks: recommendations });
}
