import { ensureTrackReady } from '@/server/acquisition/acquisition-service';
import { appPath } from '@/lib/api-path';
import { recordListeningEvent } from '@/server/library/playlist-repository';
import { recordTrackPlay } from '@/server/catalog/catalog-repository';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { trackSchema } from '@/server/protocol/schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readJson(request);
  const input = body as { track?: unknown; prefetch?: unknown } | undefined;
  const parsed = trackSchema.safeParse(input?.track);
  if (!parsed.success) return badRequest('A complete track is required');
  try {
    const result = await ensureTrackReady(parsed.data);
    if (input?.prefetch !== true) {
      await Promise.all([
        recordListeningEvent({ id: `event:${crypto.randomUUID()}`, trackId: parsed.data.id, eventType: 'play', context: 'manual' }).catch(() => undefined),
        recordTrackPlay(parsed.data.id).catch(() => undefined)
      ]);
    }
    const audioUrl = result.status === 'ready'
      ? parsed.data.streamUrl ?? appPath(`/api/stream/${encodeURIComponent(parsed.data.id)}`)
      : parsed.data.previewUrl;
    return Response.json({ ...result, audioUrl });
  } catch (error) {
    return serverError(error);
  }
}
