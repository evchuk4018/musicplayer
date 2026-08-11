import { getInitialAppState } from '@/server/app-state-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getInitialAppState());
}
