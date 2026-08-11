import { DEMO_APP_STATE } from '@/lib/demo-data';
import { databaseConfigured } from '@/server/db/client';
import { reorderQuickDial, toggleQuickDial } from '@/server/library/playlist-repository';
import { readJson, badRequest, serverError } from '@/server/protocol/http';
import { quickDialSchema, queueOrderSchema } from '@/server/protocol/schemas';

export async function PATCH(request: Request) {
  const body = await readJson(request);
  const enabledMutation = quickDialSchema.safeParse(body);
  const orderMutation = queueOrderSchema.safeParse(body);
  try {
    if (enabledMutation.success) {
      if (!databaseConfigured()) return Response.json({ quickDial: DEMO_APP_STATE.library.quickDial });
      const library = await toggleQuickDial(enabledMutation.data.playlistId, enabledMutation.data.enabled);
      return Response.json({ quickDial: library.quickDial });
    }
    if (orderMutation.success) {
      if (!databaseConfigured()) return Response.json({ quickDial: DEMO_APP_STATE.library.quickDial });
      const library = await reorderQuickDial(orderMutation.data.playlistIds);
      return Response.json({ quickDial: library.quickDial });
    }
    return badRequest('Invalid Quick Dial update');
  } catch (error) {
    return serverError(error);
  }
}
