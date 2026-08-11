import { acquisitionHealth } from '@/server/acquisition/acquisition-service';
import { databaseConfigured, query } from '@/server/db/client';
import { navidrome } from '@/server/navidrome/navidrome-adapter';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [database, navidromeStatus, acquisition] = await Promise.all([
    (async () => {
      if (!databaseConfigured()) return { status: 'not-configured' as const };
      try {
        await query('SELECT 1');
        return { status: 'up' as const };
      } catch (error) {
        return { status: 'down' as const, detail: error instanceof Error ? error.message : 'database error' };
      }
    })(),
    navidrome.health(),
    acquisitionHealth()
  ]);
  const healthy = database.status !== 'down' && navidromeStatus.status !== 'down' && acquisition.status !== 'down';
  return Response.json({ status: healthy ? 'healthy' : 'degraded', services: { database, navidrome: navidromeStatus, acquisition } }, { status: healthy ? 200 : 503 });
}
