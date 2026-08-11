import type { RecommendationContext, Track } from '@/domain/music';
import { DEMO_APP_STATE } from '@/lib/demo-data';
import { databaseConfigured } from '@/server/db/client';
import { getRecentListeningEvents } from '@/server/library/playlist-repository';
import { generateCandidates } from './candidate-generator';
import { rankRecommendations } from './ranker';

export async function getRecommendations(context: RecommendationContext = 'home', seed?: Track) {
  const { candidates, relationships } = await generateCandidates(seed);
  let events: Awaited<ReturnType<typeof getRecentListeningEvents>>['rows'] = [];
  if (databaseConfigured()) {
    try {
      events = (await getRecentListeningEvents()).rows;
    } catch {
      events = [];
    }
  }
  const recommendations = rankRecommendations(candidates, context === 'home' ? undefined : seed, relationships, events, 16);
  return recommendations.length ? recommendations : DEMO_APP_STATE.homeRecommendations;
}

export async function getHomeRecommendations() {
  return getRecommendations('home');
}
