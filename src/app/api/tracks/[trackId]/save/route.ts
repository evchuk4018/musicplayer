import { setTrackSaved, upsertCatalogTrack } from '@/server/catalog/catalog-repository';
import { databaseConfigured } from '@/server/db/client';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { trackMutationSchema, trackSchema } from '@/server/protocol/schemas';

export async function POST(request: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const body = await readJson(request) as { saved?: unknown; track?: unknown } | undefined;
  const mutation = trackMutationSchema.safeParse({ trackId: decodeURIComponent(trackId) });
  if (!mutation.success || typeof body?.saved !== 'boolean') return badRequest('Invalid saved action');
  const track = trackSchema.safeParse(body.track);
  try {
    if (databaseConfigured() && track.success) await upsertCatalogTrack(track.data);
    if (databaseConfigured()) await setTrackSaved(mutation.data.trackId, body.saved);
    return Response.json({ trackId: mutation.data.trackId, saved: body.saved });
  } catch (error) {
    return serverError(error);
  }
}
