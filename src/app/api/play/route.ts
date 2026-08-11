import { ensureTrackReady } from '@/server/acquisition/acquisition-service';
import { recordListeningEvent } from '@/server/library/playlist-repository';
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
    if (input?.prefetch !== true) await recordListeningEvent({ id: `event:${crypto.randomUUID()}`, trackId: parsed.data.id, eventType: 'play', context: 'manual' }).catch(() => undefined);
    const audioUrl = result.status === 'ready' ? parsed.data.streamUrl ?? parsed.data.previewUrl ?? `/api/stream/${encodeURIComponent(parsed.data.id)}` : parsed.data.previewUrl;
    return Response.json({ ...result, audioUrl });
  } catch (error) {
    return serverError(error);
  }
}
