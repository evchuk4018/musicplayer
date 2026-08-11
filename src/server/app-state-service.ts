import { DEMO_APP_STATE } from '@/lib/demo-data';
import type { AppState } from '@/domain/music';
import { databaseConfigured } from '@/server/db/client';
import { getLibrarySnapshot } from '@/server/library/playlist-repository';
import { listActiveJobs } from '@/server/acquisition/acquisition-repository';
import { getHomeRecommendations } from '@/server/recommendation/recommendation-service';

export async function getInitialAppState(): Promise<AppState> {
  if (!databaseConfigured()) return DEMO_APP_STATE;
  try {
    const [library, homeRecommendations, acquisitionJobs] = await Promise.all([
      getLibrarySnapshot(),
      getHomeRecommendations(),
      listActiveJobs()
    ]);
    return {
      user: DEMO_APP_STATE.user,
      library,
      homeRecommendations: homeRecommendations.length ? homeRecommendations : DEMO_APP_STATE.homeRecommendations,
      acquisitionJobs
    };
  } catch {
    return DEMO_APP_STATE;
  }
}
