import { listActiveJobs } from '@/server/acquisition/acquisition-repository';
import { databaseConfigured } from '@/server/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!databaseConfigured()) return Response.json({ jobs: [] });
  try {
    return Response.json({ jobs: await listActiveJobs() });
  } catch {
    return Response.json({ jobs: [] });
  }
}
