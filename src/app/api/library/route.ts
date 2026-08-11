import { DEMO_APP_STATE } from '@/lib/demo-data';
import { databaseConfigured } from '@/server/db/client';
import { getLibrarySnapshot } from '@/server/library/playlist-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!databaseConfigured()) return Response.json(DEMO_APP_STATE.library);
  try {
    return Response.json(await getLibrarySnapshot());
  } catch {
    return Response.json(DEMO_APP_STATE.library);
  }
}
