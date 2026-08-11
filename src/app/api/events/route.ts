import { recordListeningEvent } from '@/server/library/playlist-repository';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { eventSchema } from '@/server/protocol/schemas';

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest('Invalid listening event');
  try {
    if (process.env.DATABASE_URL) await recordListeningEvent({ id: `event:${crypto.randomUUID()}`, ...parsed.data });
    return Response.json({ ok: true }, { status: 202 });
  } catch (error) {
    return serverError(error);
  }
}
